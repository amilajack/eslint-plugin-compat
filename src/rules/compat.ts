/*
 * Step 2) Logic that handles AST traversal
 * Does not handle looking up the API
 * Handles checking what kinds of eslint nodes should be linted
 *   Tells eslint to lint certain nodes  (lintCallExpression, lintMemberExpression, lintNewExpression)
 *   Gets protochain for the ESLint nodes the plugin is interested in
 */
import { Rule } from "eslint";
import findUp from "find-up";
import fs from "fs";
import memoize from "lodash.memoize";
import path from "path";
import {
  determineTargetsFromConfig,
  lintCallExpression,
  lintExpressionStatement,
  lintLiteral,
  lintMemberExpression,
  lintNewExpression,
  parseBrowsersListVersion,
  type RuleMap,
} from "../helpers"; // will be deprecated and introduced to this file
import { nodes } from "../providers";
import {
  AstMetadataApiWithTargetsResolver,
  BrowserListConfig,
  BrowsersListOpts,
  Context,
  ESLintNode,
  HandleFailingRule,
} from "../types";

type ESLint = {
  [astNodeTypeName: string]: (node: ESLintNode) => void;
};

function getName(node: ESLintNode): string {
  switch (node.type) {
    case "NewExpression": {
      return node.callee!.name;
    }
    case "MemberExpression": {
      return node.object!.name;
    }
    case "ExpressionStatement": {
      return node.expression!.name;
    }
    case "CallExpression": {
      return node.callee!.name;
    }
    case "Literal": {
      return node.type;
    }
    default:
      throw new Error("not found");
  }
}

function generateErrorName(rule: AstMetadataApiWithTargetsResolver): string {
  if (rule.name) return rule.name;
  if (rule.property) return `${rule.object}.${rule.property}()`;
  return rule.object;
}

const getPolyfillSet = memoize(
  (polyfillArrayJSON: string): Set<string> =>
    new Set(JSON.parse(polyfillArrayJSON))
);

function isPolyfilled(
  context: Context,
  rule: AstMetadataApiWithTargetsResolver
): boolean {
  if (!context.settings?.polyfills) return false;
  const polyfills = getPolyfillSet(JSON.stringify(context.settings.polyfills));
  return (
    // v2 allowed users to select polyfills based off their caniuseId. This is
    polyfills.has(rule.id) || // no longer supported. Keeping this here to avoid breaking changes.
    polyfills.has(rule.protoChainId) || // Check if polyfill is provided (ex. `Promise.all`)
    polyfills.has(rule.protoChain[0]) // Check if entire API is polyfilled (ex. `Promise`)
  );
}

const babelConfigs = [
  "babel.config.json",
  "babel.config.js",
  "babel.config.cjs",
  ".babelrc",
  ".babelrc.json",
  ".babelrc.js",
  ".babelrc.cjs",
];

/**
 * Determine if a user has a babel config, which we use to infer if the linted code is polyfilled.
 * Memoized by directory so multiple files in the same project reuse the result.
 */
const isUsingTranspiler = memoize(
  (filePath: string): boolean => {
    const dir = path.dirname(filePath);
    const configPath = findUp.sync(babelConfigs, {
      cwd: dir,
    });
    if (configPath) return true;
    const pkgPath = findUp.sync("package.json", {
      cwd: dir,
    });
    // Check if babel property exists
    if (pkgPath) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath).toString());
      return !!pkg.babel;
    }
    return false;
  },
  (filePath: string) => path.resolve(path.dirname(filePath))
);

type RuleMapsForTargets = {
  callExpression: RuleMap;
  newExpression: RuleMap;
  expressionStatement: RuleMap;
  memberExpression: RuleMap;
  literal: RuleMap;
};

/**
 * A small optimization that only lints APIs that are not supported by targeted browsers.
 * For example, if the user is targeting chrome 50, which supports the fetch API, it is
 * wasteful to lint calls to fetch.
 * Returns Maps for O(1) rule lookup per node (first match wins).
 */
const getRulesForTargets = memoize(
  (targetsJSON: string, lintAllEsApis: boolean): RuleMapsForTargets => {
    const byType = {
      CallExpression: [] as AstMetadataApiWithTargetsResolver[],
      NewExpression: [] as AstMetadataApiWithTargetsResolver[],
      MemberExpression: [] as AstMetadataApiWithTargetsResolver[],
      ExpressionStatement: [] as AstMetadataApiWithTargetsResolver[],
      Literal: [] as AstMetadataApiWithTargetsResolver[],
    };
    const targets = JSON.parse(targetsJSON);

    nodes
      .filter((node) => (lintAllEsApis ? true : node.kind !== "es"))
      .forEach((node) => {
        if (!node.getUnsupportedTargets(node, targets).length) return;
        byType[node.astNodeType].push(node);
      });

    const callExpression = new Map<string, AstMetadataApiWithTargetsResolver>();
    for (const rule of byType.CallExpression) {
      const key = rule.object.toLowerCase();
      if (!callExpression.has(key)) callExpression.set(key, rule);
    }
    const newExpression = new Map<string, AstMetadataApiWithTargetsResolver>();
    for (const rule of byType.NewExpression) {
      const key = rule.object.toLowerCase();
      if (!newExpression.has(key)) newExpression.set(key, rule);
    }
    const expressionStatement = new Map<string, AstMetadataApiWithTargetsResolver>();
    for (const rule of [...byType.MemberExpression, ...byType.CallExpression]) {
      const key = rule.object.toLowerCase();
      if (!expressionStatement.has(key))
        expressionStatement.set(key, rule);
    }
    const memberExpression = new Map<string, AstMetadataApiWithTargetsResolver>();
    for (const rule of [
      ...byType.MemberExpression,
      ...byType.CallExpression,
      ...byType.NewExpression,
    ]) {
      const protoChainKey = rule.protoChainId.toLowerCase();
      if (!memberExpression.has(protoChainKey))
        memberExpression.set(protoChainKey, rule);
      const key = (rule.property ? `${rule.object}.${rule.property}` : rule.object).toLowerCase();
      if (!memberExpression.has(key)) memberExpression.set(key, rule);
    }
    const literal = new Map<string, AstMetadataApiWithTargetsResolver>();
    for (const rule of byType.Literal) {
      for (const syntax of rule.syntaxes ?? []) {
        if (!literal.has(syntax)) literal.set(syntax, rule);
      }
    }

    return {
      callExpression,
      newExpression,
      expressionStatement,
      memberExpression,
      literal,
    };
  }
);

export default {
  meta: {
    docs: {
      description: "Ensure cross-browser API compatibility",
      category: "Compatibility",
      url: "https://github.com/amilajack/eslint-plugin-compat/blob/main/docs/rules/compat.md",
      recommended: true,
    },
    type: "problem",
    schema: [{ type: "string" }],
  },
  create(context: Context): ESLint {
    const sourceCode =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (context as any).sourceCode ?? (context as any).getSourceCode();

    // Determine lowest targets from browserslist config, which reads user's
    // package.json config section. Use config from eslintrc for testing purposes
    const browserslistConfig: BrowserListConfig =
      context.settings?.browsers ||
      context.settings?.targets ||
      context.options[0];

    if (
      !context.settings?.browserslistOpts &&
      // @ts-expect-error Checking for accidental misspellings
      context.settings.browsersListOpts
    ) {
      // eslint-disable-next-line -- CLI
      console.error(
        'Please ensure you spell `browserslistOpts` with a lowercase "l"!'
      );
    }
    const browserslistOpts: BrowsersListOpts | undefined =
      context.settings?.browserslistOpts;

    const browserslistDir =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (context as any).filename ?? (context as any).getFilename();
    const lintAllEsApis: boolean =
      context.settings?.lintAllEsApis === true ||
      // Attempt to infer polyfilling of ES APIs from babel config
      (!context.settings?.polyfills?.includes("es:all") &&
        !isUsingTranspiler(browserslistDir));
    const browserslistTargets = parseBrowsersListVersion(
      determineTargetsFromConfig(
        browserslistDir,
        browserslistConfig,
        browserslistOpts
      )
    );

    // Stringify to support memoization; browserslistConfig is always an array of new objects.
    const ruleMaps = getRulesForTargets(
      JSON.stringify(browserslistTargets),
      lintAllEsApis
    );

    type Error = {
      message: string;
      node: ESLintNode;
    };

    const errors: Error[] = [];

    // Cache getUnsupportedTargets per rule; targets are fixed for this context.
    const unsupportedTargetsByRule = new Map<string, string>();
    const getUnsupportedTargetsMessage = (
      rule: AstMetadataApiWithTargetsResolver
    ): string => {
      let message = unsupportedTargetsByRule.get(rule.id);
      if (message === undefined) {
        message = rule
          .getUnsupportedTargets(rule, browserslistTargets)
          .join(", ");
        unsupportedTargetsByRule.set(rule.id, message);
      }
      return message;
    };

    const handleFailingRule: HandleFailingRule = (
      node: AstMetadataApiWithTargetsResolver,
      eslintNode: ESLintNode
    ) => {
      if (isPolyfilled(context, node)) return;
      errors.push({
        node: eslintNode,
        message: [
          generateErrorName(node),
          "is not supported in",
          getUnsupportedTargetsMessage(node),
        ].join(" "),
      });
    };

    const identifiers = new Set();

    return {
      CallExpression: lintCallExpression.bind(
        null,
        context,
        handleFailingRule,
        ruleMaps.callExpression,
        sourceCode
      ),
      NewExpression: lintNewExpression.bind(
        null,
        context,
        handleFailingRule,
        ruleMaps.newExpression,
        sourceCode
      ),
      ExpressionStatement: lintExpressionStatement.bind(
        null,
        context,
        handleFailingRule,
        ruleMaps.expressionStatement,
        sourceCode
      ),
      MemberExpression: lintMemberExpression.bind(
        null,
        context,
        handleFailingRule,
        ruleMaps.memberExpression,
        sourceCode
      ),
      Literal: lintLiteral.bind(
        null,
        context,
        handleFailingRule,
        ruleMaps.literal,
        sourceCode
      ),
      // Keep track of all the defined variables. Do not report errors for nodes that are not defined
      Identifier(node: ESLintNode) {
        if (node.parent) {
          const { type } = node.parent;
          if (
            type === "Property" || // ex. const { Set } = require('immutable');
            type === "FunctionDeclaration" || // ex. function Set() {}
            type === "VariableDeclarator" || // ex. const Set = () => {}
            type === "ClassDeclaration" || // ex. class Set {}
            type === "ImportDefaultSpecifier" || // ex. import Set from 'set';
            type === "ImportSpecifier" || // ex. import {Set} from 'set';
            type === "ImportDeclaration" // ex. import {Set} from 'set';
          ) {
            identifiers.add(node.name);
          }
        }
      },
      "Program:exit": () => {
        // Get a map of all the variables defined in the root scope (not the global scope)
        // const variablesMap = context.getScope().childScopes.map(e => e.set)[0];
        errors
          .filter((error) => !identifiers.has(getName(error.node)))
          .forEach((node) => context.report(node as Rule.ReportDescriptor));
      },
    };
  },
} as unknown as Rule.RuleModule;
