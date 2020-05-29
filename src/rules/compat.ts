import findUp from "find-up";
import memoize from "lodash.memoize";
import {
  lintCallExpression,
  lintMemberExpression,
  lintNewExpression,
  lintExpressionStatement,
} from "../Lint";
import determineTargetsFromConfig, { versioning } from "../Versioning";
import type { ESLintNode, Node, BrowserListConfig } from "../LintTypes";
import { nodes } from "../providers";

type ESLint = {
  [astNodeTypeName: string]: (node: ESLintNode) => void;
};

type Context = {
  node: ESLintNode;
  options: Array<string>;
  settings: {
    browsers: Array<string>;
    polyfills: Array<string>;
  };
  getFilename: () => string;
  report: () => void;
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

function hasTranspiledConfigs(dir: string): void {
  const configPath = findUp.sync.exists(items, {
    cwd: dir,
  });
  if (configPath) return true;
  const { babel } = findUp.sync.exists("package.json", {
    cwd: dir,
  });
  return !!babel;
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
      context.settings.browsers ||
      context.settings.targets ||
      context.options[0];

    const ignoreAllEsApis: boolean =
      (context.settings.forceAllEsApis !== true &&
        !!context.parserOptions?.tsconfigRootDir) ||
      context.settings?.polyfills?.includes("es:all") ||
      hasTranspiledConfigs(context.getFilename());

    const browserslistTargets = versioning(
      determineTargetsFromConfig(context.getFilename(), browserslistConfig)
    );

    const getRulesForTargets = memoize(
      (targetsJSON: string): Object => {
        const result = {
          CallExpression: [],
          NewExpression: [],
          MemberExpression: [],
          ExpressionStatement: [],
        };
        const targets = JSON.parse(targetsJSON);

        nodes
          .filter((node) => {
            return ignoreAllEsApis ? node.kind !== "es" : true;
          })
          .forEach((node) => {
            if (!node.getUnsupportedTargets(node, targets).length) return;
            result[node.astNodeType].push(node);
          });

        return result;
      }
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
          node.getUnsupportedTargets(node, browserslistTargets).join(", "),
        ].join(" "),
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
