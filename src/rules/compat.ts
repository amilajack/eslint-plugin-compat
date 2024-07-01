/*
 * Step 2) Logic that handles AST traversal
 * Does not handle looking up the API
 * Handles checking what kinds of eslint nodes should be linted
 *   Tells eslint to lint certain nodes  (lintCallExpression, lintMemberExpression, lintNewExpression)
 *   Gets protochain for the ESLint nodes the plugin is interested in
 */
import fs from "fs";
import findUp from "find-up";
import memoize from "lodash.memoize";
import { Rule } from "eslint";
import {
  lintCallExpression,
  lintMemberExpression,
  lintNewExpression,
  lintExpressionStatement,
  parseBrowsersListVersion,
  determineTargetsFromConfig,
} from "../helpers"; // will be deprecated and introduced to this file
import {
  ESLintNode,
  AstMetadataApiWithTargetsResolver,
  BrowserListConfig,
  HandleFailingRule,
  Context,
  BrowsersListOpts,
} from "../types";
import { nodes } from "../providers";

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
 */
function isUsingTranspiler(context: Context): boolean {
  const dir = context.filename ?? context.getFilename();
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
}

type RulesFilteredByTargets = {
  CallExpression: AstMetadataApiWithTargetsResolver[];
  NewExpression: AstMetadataApiWithTargetsResolver[];
  MemberExpression: AstMetadataApiWithTargetsResolver[];
  ExpressionStatement: AstMetadataApiWithTargetsResolver[];
};

/**
 * A small optimization that only lints APIs that are not supported by targeted browsers.
 * For example, if the user is targeting chrome 50, which supports the fetch API, it is
 * wasteful to lint calls to fetch.
 */
const getRulesForTargets = memoize(
  (targetsJSON: string, lintAllEsApis: boolean): RulesFilteredByTargets => {
    const result = {
      CallExpression: [] as AstMetadataApiWithTargetsResolver[],
      NewExpression: [] as AstMetadataApiWithTargetsResolver[],
      MemberExpression: [] as AstMetadataApiWithTargetsResolver[],
      ExpressionStatement: [] as AstMetadataApiWithTargetsResolver[],
    };
    const targets = JSON.parse(targetsJSON);

    nodes
      .filter((node) => (lintAllEsApis ? true : node.kind !== "es"))
      .forEach((node) => {
        if (!node.getUnsupportedTargets(node, targets).length) return;
        result[node.astNodeType].push(node);
      });

    return result;
  }
);

export default {
  meta: {
    docs: {
      description: "Ensure cross-browser API compatibility",
      category: "Compatibility",
      url: "https://github.com/amilajack/eslint-plugin-compat/blob/master/docs/rules/compat.md",
      recommended: true,
    },
    type: "problem",
    schema: [{ type: "string" }],
  },
  create(context: Context): ESLint {
    const sourceCode = context.sourceCode ?? context.getSourceCode();

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

    const lintAllEsApis: boolean =
      context.settings?.lintAllEsApis === true ||
      // Attempt to infer polyfilling of ES APIs from babel config
      (!context.settings?.polyfills?.includes("es:all") &&
        !isUsingTranspiler(context));
    const browserslistTargets = parseBrowsersListVersion(
      determineTargetsFromConfig(
        context.getFilename(),
        browserslistConfig,
        browserslistOpts
      )
    );

    // Stringify to support memoization; browserslistConfig is always an array of new objects.
    const targetedRules = getRulesForTargets(
      JSON.stringify(browserslistTargets),
      lintAllEsApis
    );

    type Error = {
      message: string;
      node: ESLintNode;
    };

    const errors: Error[] = [];

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
          node.getUnsupportedTargets(node, browserslistTargets).join(", "),
        ].join(" "),
      });
    };

    const identifiers = new Set();

    return {
      CallExpression: lintCallExpression.bind(
        null,
        context,
        handleFailingRule,
        targetedRules.CallExpression,
        sourceCode
      ),
      NewExpression: lintNewExpression.bind(
        null,
        context,
        handleFailingRule,
        targetedRules.NewExpression,
        sourceCode
      ),
      ExpressionStatement: lintExpressionStatement.bind(
        null,
        context,
        handleFailingRule,
        [...targetedRules.MemberExpression, ...targetedRules.CallExpression],
        sourceCode
      ),
      MemberExpression: lintMemberExpression.bind(
        null,
        context,
        handleFailingRule,
        [
          ...targetedRules.MemberExpression,
          ...targetedRules.CallExpression,
          ...targetedRules.NewExpression,
        ],
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
} as Rule.RuleModule;
