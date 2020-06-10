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
} from "../types";
import { nodes } from "../providers";

type ESLint = {
  [astNodeTypeName: string]: (node: ESLintNode) => void;
};

function getName(node: ESLintNode): string {
  switch (node.type) {
    case "NewExpression": {
      return node.callee.name;
    }
    case "MemberExpression": {
      return node.object.name;
    }
    case "ExpressionStatement": {
      return node.expression.name;
    }
    case "CallExpression": {
      return node.callee.name;
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
  (polyfillArrayJSON: string): Set<String> =>
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

const items = [
  // Babel configs
  "babel.config.json",
  "babel.config.js",
  ".babelrc",
  ".babelrc.json",
  ".babelrc.js",
  // TS configs
  "tsconfig.json",
];

/**
 * Determine if a user has a TS or babel config. This is used to infer if a user is transpiling their code.
 * If transpiling code, do not lint ES APIs. We assume that all transpiled code is polyfilled.
 * @TODO Use @babel/core to find config. See https://github.com/babel/babel/discussions/11602
 * @param dir @
 */
function isUsingTranspiler(context: Context): boolean {
  // If tsconfig config exists in parser options, assume transpilation
  if (context.parserOptions?.tsconfigRootDir === true) return true;
  const dir = context.getFilename();
  const configPath = findUp.sync(items, {
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

export default {
  meta: {
    docs: {
      description: "Ensure cross-browser API compatibility",
      category: "Compatibility",
      url:
        "https://github.com/amilajack/eslint-plugin-compat/blob/master/docs/rules/compat.md",
      recommended: true,
    },
    type: "problem",
    schema: [{ type: "string" }],
  },
  create(context: Context): ESLint {
    // Determine lowest targets from browserslist config, which reads user's
    // package.json config section. Use config from eslintrc for testing purposes
    const browserslistConfig: BrowserListConfig =
      context.settings?.browsers ||
      context.settings?.targets ||
      context.options[0];

    const lintAllEsApis: boolean =
      context.settings?.lintAllEsApis === true ||
      // Attempt to infer polyfilling of ES APIs from ts or babel config
      (!context.settings?.polyfills?.includes("es:all") &&
        !isUsingTranspiler(context));
    const browserslistTargets = parseBrowsersListVersion(
      determineTargetsFromConfig(context.getFilename(), browserslistConfig)
    );

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
      (targetsJSON: string): RulesFilteredByTargets => {
        const result = {
          CallExpression: [],
          NewExpression: [],
          MemberExpression: [],
          ExpressionStatement: [],
        };
        const targets = JSON.parse(targetsJSON);

        nodes
          .filter((node) => {
            return lintAllEsApis ? true : node.kind !== "es";
          })
          .forEach((node) => {
            if (!node.getUnsupportedTargets(node, targets).length) return;
            result[node.astNodeType as keyof RulesFilteredByTargets].push(node);
          });

        return result;
      }
    );

    // Stringify to support memoization; browserslistConfig is always an array of new objects.
    const targetedRules = getRulesForTargets(
      JSON.stringify(browserslistTargets)
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
        targetedRules.CallExpression
      ),
      NewExpression: lintNewExpression.bind(
        null,
        context,
        handleFailingRule,
        targetedRules.NewExpression
      ),
      ExpressionStatement: lintExpressionStatement.bind(
        null,
        context,
        handleFailingRule,
        [...targetedRules.MemberExpression, ...targetedRules.CallExpression]
      ),
      MemberExpression: lintMemberExpression.bind(
        null,
        context,
        handleFailingRule,
        [
          ...targetedRules.MemberExpression,
          ...targetedRules.CallExpression,
          ...targetedRules.NewExpression,
        ]
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
          .forEach((node) => context.report(node));
      },
    };
  },
};
