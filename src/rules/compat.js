// @flow
import memoize from "lodash.memoize";
import {
  lintCallExpression,
  lintMemberExpression,
  lintNewExpression,
  lintExpressionStatement
} from "../Lint";
import determineTargetsFromConfig, { Versioning } from "../Versioning";
import type { ESLintNode, Node, BrowserListConfig } from "../LintTypes";
import { nodes } from "../providers";

type ESLint = {
  [astNodeTypeName: string]: (node: ESLintNode) => void
};

type Context = {
  node: ESLintNode,
  options: Array<string>,
  settings: {
    browsers: Array<string>,
    polyfills: Array<string>
  },
  getFilename: () => string,
  report: () => void
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

function generateErrorName(rule: Node): string {
  if (rule.name) return rule.name;
  if (rule.property) return `${rule.object}.${rule.property}()`;
  return rule.object;
}

const getPolyfillSet = memoize(
  (polyfillArrayJSON: string): Set<String> =>
    new Set(JSON.parse(polyfillArrayJSON))
);

function isPolyfilled(context: Context, rule: Node): boolean {
  if (!context.settings.polyfills) return false;
  const polyfills = getPolyfillSet(JSON.stringify(context.settings.polyfills));
  return (
    // v2 allowed users to select polyfills based off their caniuseId. This is
    // no longer supported. Keeping this here to avoid breaking changes.
    polyfills.has(rule.id) ||
    // Check if polyfill is provided (ex. `Promise.all`)
    polyfills.has(rule.protoChainId) ||
    // Check if entire API is polyfilled (ex. `Promise`)
    polyfills.has(rule.protoChain[0])
  );
}

const getRulesForTargets = memoize((targetsJSON: string): Object => {
  const result = {
    CallExpression: [],
    NewExpression: [],
    MemberExpression: [],
    ExpressionStatement: []
  };
  const targets = JSON.parse(targetsJSON);
  nodes.forEach(node => {
    if (!node.getUnsupportedTargets(node, targets).length) return;
    result[node.astNodeType].push(node);
  });
  return result;
});

export default {
  meta: {
    docs: {
      description: "Ensure cross-browser API compatibility",
      category: "Compatibility",
      url:
        "https://github.com/amilajack/eslint-plugin-compat/blob/master/docs/rules/compat.md",
      recommended: true
    },
    type: "problem",
    schema: [{ type: "string" }]
  },
  create(context: Context): ESLint {
    // Determine lowest targets from browserslist config, which reads user's
    // package.json config section. Use config from eslintrc for testing purposes
    const browserslistConfig: BrowserListConfig =
      context.settings.browsers ||
      context.settings.targets ||
      context.options[0];

    const browserslistTargets = Versioning(
      determineTargetsFromConfig(context.getFilename(), browserslistConfig)
    );

    // Stringify to support memoization; browserslistConfig is always an array of new objects.
    const targetedRules = getRulesForTargets(
      JSON.stringify(browserslistTargets)
    );

    const errors = [];

    function handleFailingRule(node: Node, eslintNode: ESLintNode) {
      if (isPolyfilled(context, node)) return;
      errors.push({
        node: eslintNode,
        message: [
          generateErrorName(node),
          "is not supported in",
          node.getUnsupportedTargets(node, browserslistTargets).join(", ")
        ].join(" ")
      });
    }

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
          ...targetedRules.NewExpression
        ]
      ),
      // Keep track of all the defined variables. Do not report errors for nodes that are not defined
      Identifier(node: ESLintNode) {
        if (node.parent) {
          const { type } = node.parent;
          if (
            // ex. const { Set } = require('immutable');
            type === "Property" ||
            // ex. function Set() {}
            type === "FunctionDeclaration" ||
            // ex. const Set = () => {}
            type === "VariableDeclarator" ||
            // ex. class Set {}
            type === "ClassDeclaration" ||
            // ex. import Set from 'set';
            type === "ImportDefaultSpecifier" ||
            // ex. import {Set} from 'set';
            type === "ImportSpecifier" ||
            // ex. import {Set} from 'set';
            type === "ImportDeclaration"
          ) {
            identifiers.add(node.name);
          }
        }
      },
      "Program:exit": () => {
        // Get a map of all the variables defined in the root scope (not the global scope)
        // const variablesMap = context.getScope().childScopes.map(e => e.set)[0];
        errors
          .filter(error => !identifiers.has(getName(error.node)))
          .forEach(node => context.report(node));
      }
    };
  }
};
