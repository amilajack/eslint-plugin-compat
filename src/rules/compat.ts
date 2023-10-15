/*
 * Step 2) Logic that handles AST traversal
 * Does not handle looking up the API
 * Handles checking what kinds of eslint nodes should be linted
 *   Tells eslint to lint certain nodes  (lintCallExpression, lintMemberExpression, lintNewExpression)
 *   Gets protochain for the ESLint nodes the plugin is interested in
 */
import memoize from "lodash.memoize";
import { Rule } from "eslint";
import type * as ESTree from "estree";
import {
  determineSettings,
  isInsideTypeofCheck,
  determineGuardedScope,
  GuardedScope,
  isBlockOrProgram,
  identifierProtoChain,
  GLOBALS,
} from "../helpers"; // will be deprecated and introduced to this file
import {
  AstMetadataApiWithTargetsResolver,
  HandleFailingRule,
  Context,
} from "../types";
import { nodes } from "../providers";

function getErrorNode(node: Rule.Node): Rule.Node {
  switch (node.type) {
    case "MemberExpression": {
      return node.property as Rule.Node;
    }
    case "Identifier": {
      return node;
    }
    default:
      throw new Error("not found");
  }
}

function getName(node: Rule.Node): string {
  switch (node.type) {
    case "Identifier": {
      return node.name;
    }
    case "MemberExpression": {
      return (node.object as ESTree.Identifier).name;
    }
    default:
      throw new Error("not found");
  }
}

function generateErrorName(rule: AstMetadataApiWithTargetsResolver): string {
  if (rule.name) return rule.name;
  if (rule.property) return `${rule.object}.${rule.property}`;
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
    const targets = JSON.parse(targetsJSON);

    const result: Record<string, AstMetadataApiWithTargetsResolver> = {};

    for (const node of nodes) {
      if (
        (lintAllEsApis || node.kind !== "es") &&
        node.getUnsupportedTargets(targets).length > 0
      ) {
        result[node.protoChainId] = node;
      }
    }

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

      // TODO: name should never include leading "window" or "globalThis"
      // and location should also not include it, we have to compute location ourselves

      errors.push({
        node: getErrorNode(eslintNode),
        message: [
          generateErrorName(node),
          "is not supported in",
          node.getUnsupportedTargets(browserslistTargets).join(", "),
        ].join(" "),
      });
    };

    const identifiers = new Set();
    const guardedScopes = new Map<GuardedScope["scope"], number>();

    function shouldIncludeError(err: Error, idx: number) {
      // This matches a rule but it's defined in the global scope
      if (identifiers.has(getName(err.node))) return false;

      let expression: Rule.Node = err.node;
      while (!isBlockOrProgram(expression.parent)) {
        expression = expression.parent;
      }

      // expression is a child of a Program or BlockStatement
      const scope = expression.parent;
      const guardedScope = guardedScopes.get(scope);
      if (guardedScope != null) {
        const index = scope.body.findIndex((value) => value === expression);
        if (index >= guardedScope) {
          return false;
        }
      }

      // check if this node has already been reported
      for (let i = 0; i < idx; i++) {
        if (errors[i].node === err.node) {
          return false;
        }
      }

      return true;
    }

    return {
      Identifier(node) {
        // Keep track of all the defined variables. Do not report errors for nodes that are not defined
        switch (node.parent.type) {
          case "Property": // ex. const { Set } = require('immutable');
          case "FunctionDeclaration": // ex. function Set() {}
          case "VariableDeclarator": // ex. const Set = () => {}
          case "ClassDeclaration": // ex. class Set {}
          case "ImportDefaultSpecifier": // ex. import Set from 'set';
          case "ImportSpecifier": // ex. import {Set} from 'set';
          case "ImportDeclaration": // ex. import {Set} from 'set';
            identifiers.add(node.name);
        }

        // Check if identifier is one we care about
        const result = identifierProtoChain(node);
        if (!result) return;

        // Check if the identifier name matches any of the ones in our list
        const protoChainId = result.protoChain.join(".");
        const rule = targetedRules[protoChainId];
        if (!rule) return;

        // If this a bare Identifier, not window / globalThis, and not used
        // in a `typeof` expression, then we can error immediately
        if (
          result.expression.type === "Identifier" &&
          !GLOBALS.includes(result.expression.name) &&
          !isInsideTypeofCheck(result.expression)
        ) {
          // This will always produce a `ReferenceError` in unsupported browsers
          handleFailingRule(rule, node);
          return;
        }

        const scope = determineGuardedScope(result.expression);
        if (scope) {
          guardedScopes.set(scope.scope, scope.index);
          return;
        }

        // This node isn't guarding an if statement, so report it as an error.
        // Unless this is an optional call expression, which is a valid way to
        // call a potentially undefined function.
        if (
          result.expression.parent.type === "CallExpression" &&
          result.expression.parent.optional
        ) {
          return;
        }

        handleFailingRule(rule, result.expression);
      },
      "Program:exit": () => {
        // Get a map of all the variables defined in the root scope (not the global scope)
        // const variablesMap = context.getScope().childScopes.map(e => e.set)[0];
        errors
          .filter(shouldIncludeError)
          .forEach((node) => context.report(node));
      },
    };
  },
};

export default ruleModule;
