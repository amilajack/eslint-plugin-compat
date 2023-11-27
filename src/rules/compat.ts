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
  determineIfStatementAndGuardedScope,
  isBlockOrProgram,
  identifierProtoChain,
  expressionWouldThrow,
  isStringLiteral,
} from "../helpers"; // will be deprecated and introduced to this file
import {
  AstMetadataApiWithTargetsResolver,
  HandleFailingRule,
  Context,
} from "../types";
import { nodes } from "../providers";

function getName(node: Rule.Node): string | null {
  switch (node.type) {
    case "Identifier": {
      return node.name;
    }
    case "MemberExpression": {
      return (node.object as ESTree.Identifier).name;
    }
    default:
      return null;
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

    const result: {
      objects: Record<string, AstMetadataApiWithTargetsResolver>;
      regexps: Record<string, AstMetadataApiWithTargetsResolver>;
    } = { objects: {}, regexps: {} };

    for (const node of nodes) {
      if (
        (lintAllEsApis || node.kind !== "es") &&
        node.getUnsupportedTargets(targets).length > 0
      ) {
        if (node.regexp) {
          result.regexps[node.protoChainId] = node;
        } else {
          result.objects[node.protoChainId] = node;
        }
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

    const reportedNodes = new Set<Rule.Node>();

    const handleFailingRule: HandleFailingRule = (
      rule: AstMetadataApiWithTargetsResolver,
      node: Rule.Node
    ) => {
      if (isPolyfilled(context, rule)) return;
      if (!shouldIncludeError(node)) return;

      reportedNodes.add(node);

      // TODO: name should never include leading "window" or "globalThis"
      // and location should also not include it, we have to compute location ourselves

      context.report({
        node,
        message: [
          generateErrorName(rule),
          "is not supported in",
          rule.getUnsupportedTargets(browserslistTargets).join(", "),
        ].join(" "),
      });
    };

    const identifiers = new Set();
    const guardedScopes = new Map<Rule.Node, number>();

    function shouldIncludeError(node: Rule.Node) {
      // check if this node has already been reported
      // TODO: ideally our rules would be smart enough to only include the
      // highest member of the property chain if the members have the exact same
      // browser support window, so we don't have the issue of duplicates like
      // Promise and Promise.resolve, etc.
      if (reportedNodes.has(node)) {
        return false;
      }

      // This matches a rule but it's defined in the global scope
      if (identifiers.has(getName(node))) return false;

      let expression: Rule.Node = node;
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

      return true;
    }

    return {
      Identifier(node) {
        if (node.name === "undefined") return;

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
            // These would never be errors so we can return early
            return;
        }

        // Check if identifier is one we care about
        const result = identifierProtoChain(node);
        if (!result) return;

        // Check if the identifier name matches any of the ones in our list
        const protoChainId = result.protoChain.join(".");
        const rule = targetedRules.objects[protoChainId];
        if (!rule) return;

        if (expressionWouldThrow(result.expression)) {
          handleFailingRule(rule, result.expression);
          return;
        }

        // If it is an optional function call, then we can bail
        if (
          result.expression.parent.type === "CallExpression" &&
          result.expression.parent.optional
        ) {
          return;
        }

        const { ifStatement, guardedScope } =
          determineIfStatementAndGuardedScope(result.expression);
        if (guardedScope) {
          guardedScopes.set(guardedScope.scope, guardedScope.index);
          return;
        }

        // This identifier is used inside an if statement and won't cause any
        // runtime issues, so don't report anything.
        if (ifStatement) return;

        // This node isn't guarding an if statement, so report it as an error.
        handleFailingRule(rule, result.expression);
      },

      ...(Object.keys(targetedRules.regexps).length === 0
        ? {}
        : {
            'NewExpression[callee.name="RegExp"],Literal[regex]'(
              node: Rule.Node
            ) {
              let regexString: string | undefined;

              if (
                node.type === "NewExpression" &&
                isStringLiteral(node.arguments[0])
              ) {
                regexString = node.arguments[0].value;
              } else if (node.type === "Literal") {
                regexString = (node as ESTree.RegExpLiteral).regex.pattern;
              }

              if (!regexString) return;

              for (const rule of Object.values(targetedRules.regexps)) {
                switch (rule.id) {
                  case "js-regexp-lookbehind": {
                    if (
                      regexString.includes("(?<=") ||
                      regexString.includes("(?<!")
                    ) {
                      // would be cool to report the exact location of the lookbehind
                      handleFailingRule(rule, node);
                      return;
                    }
                    break;
                  }
                }
              }
            },
          }),
    };
  },
};

export default ruleModule;
