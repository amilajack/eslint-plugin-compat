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
} from "../helpers"; // will be deprecated and introduced to this file
import {
  AstMetadataApiWithTargetsResolver,
  HandleFailingRule,
  Context,
} from "../types";
import { nodes } from "../providers";

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

    nodes
      .filter((node) => (lintAllEsApis ? true : node.kind !== "es"))
      .forEach((node) => {
        if (!node.getUnsupportedTargets(targets).length) return;
        result[node.property || node.object] = node;
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
    const guardedScopes = new Map<GuardedScope["scope"], number>();

    function shouldIncludeError(node: Rule.Node) {
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
        if (node.parent) {
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
        }

        // Check if the identifier name matches any of the ones in our list
        const name = node.name;
        const rule = targetedRules[name];
        if (!rule) return;

        if (
          node.parent.type !== "MemberExpression" &&
          !isInsideTypeofCheck(node)
        ) {
          // This will always produce a ReferenceError in unsupported browsers
          handleFailingRule(rule, node);
          return;
        }

        let object = "window";

        let expression: Rule.Node = node;
        if (expression.parent.type === "MemberExpression") {
          expression = expression.parent;
          if (expression.object.type === "MemberExpression") {
            // thing.Promise.all, thing.thing.Promise.all, ignore this
            if (
              expression.object.object.type !== "Literal" ||
              expression.object.object.value !== "window" ||
              expression.object.property.type !== "Identifier"
            ) {
              return;
            }

            // window.Promise.all, for example
            object = expression.object.property.name;
          } else if (expression.object.type === "Identifier") {
            object = expression.object.name;
          } else {
            // unrecognized syntax
            return;
          }
        }

        // This doesn't actually match our rule, like `Thing.all`
        if (object !== "window" && rule.object !== object) return;

        const scope = determineGuardedScope(expression);
        if (!scope) {
          // this node isn't guarding an if statement, so we can report an error
          handleFailingRule(rule, expression);
          return;
        }

        // Otherwise let's mark the scope that this node is guarding
        guardedScopes.set(scope.scope, scope.index);
      },
      "Program:exit": () => {
        // Get a map of all the variables defined in the root scope (not the global scope)
        // const variablesMap = context.getScope().childScopes.map(e => e.set)[0];
        errors
          .filter((error) => shouldIncludeError(error.node))
          .forEach((node) => context.report(node));
      },
    };
  },
};

export default ruleModule;
