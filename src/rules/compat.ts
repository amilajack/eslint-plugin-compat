/*
 * Step 2) Logic that handles AST traversal
 * Does not handle looking up the API
 * Handles checking what kinds of eslint nodes should be linted
 *   Tells eslint to lint certain nodes  (lintCallExpression, lintMemberExpression, lintNewExpression)
 *   Gets protochain for the ESLint nodes the plugin is interested in
 */
import memoize from "lodash.memoize";
import { Rule } from "eslint";
import {
  lintCallExpression,
  lintMemberExpression,
  lintNewExpression,
  lintExpressionStatement,
  determineSettings,
} from "../helpers"; // will be deprecated and introduced to this file
import {
  AstMetadataApiWithTargetsResolver,
  HandleFailingRule,
  Context,
} from "../types";
import { nodes } from "../providers";

function getName(node: Rule.Node): string {
  switch (node.type) {
    case "NewExpression": {
      return (node.callee as any).name;
    }
    case "MemberExpression": {
      return (node.object as any).name;
    }
    case "ExpressionStatement": {
      return (node.expression as any).name;
    }
    case "CallExpression": {
      return (node.callee as any).name;
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
  if (!context.settings.polyfills) return false;
  const polyfills = getPolyfillSet(JSON.stringify(context.settings.polyfills));
  return (
    // v2 allowed users to select polyfills based off their caniuseId. This is
    polyfills.has(rule.id) || // no longer supported. Keeping this here to avoid breaking changes.
    polyfills.has(rule.protoChainId) || // Check if polyfill is provided (ex. `Promise.all`)
    polyfills.has(rule.protoChain[0]) // Check if entire API is polyfilled (ex. `Promise`)
  );
}

/**
 * A small optimization that only lints APIs that are not supported by targeted browsers.
 * For example, if the user is targeting chrome 50, which supports the fetch API, it is
 * wasteful to lint calls to fetch.
 */
const getRulesForTargets = memoize(
  (targetsJSON: string, lintAllEsApis: boolean) => {
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
        if (!node.getUnsupportedTargets(targets).length) return;
        result[node.astNodeType].push(node);
      });

    return result;
  }
);

const ruleModule: Rule.RuleModule = {
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
  create(context: Context) {
    const { lintAllEsApis, browserslistTargets } = determineSettings(context);

    // Stringify to support memoization; browserslistConfig is always an array of new objects.
    const targetedRules = getRulesForTargets(
      JSON.stringify(browserslistTargets),
      lintAllEsApis
    );

    type Error = {
      message: string;
      node: Rule.Node;
    };

    const errors: Error[] = [];

    const handleFailingRule: HandleFailingRule = (
      node: AstMetadataApiWithTargetsResolver,
      eslintNode: Rule.Node
    ) => {
      if (isPolyfilled(context, node)) return;
      errors.push({
        node: eslintNode,
        message: [
          generateErrorName(node),
          "is not supported in",
          node.getUnsupportedTargets(browserslistTargets).join(", "),
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
      Identifier(node) {
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

export default ruleModule;
