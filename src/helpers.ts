import fs from "fs";

import browserslist from "browserslist";
import type { Rule } from "eslint";
import type * as ESTree from "estree";
import findUp from "find-up";

import { BrowserListConfig, Target, Context, BrowsersListOpts } from "./types";
import { TargetNameMappings } from "./constants";

const BABEL_CONFIGS = [
  "babel.config.json",
  "babel.config.js",
  "babel.config.cjs",
  ".babelrc",
  ".babelrc.json",
  ".babelrc.js",
  ".babelrc.cjs",
];

export const GLOBALS = ["window", "globalThis"];

/*
3) Figures out which browsers user is targeting

- Uses browserslist config and/or targets defined eslint config to discover this
- For every API ecnountered during traversal, gets compat record for that
- Protochain (e.g. 'document.querySelector')
  - All of the rules have compatibility info attached to them
- Each API is given to versioning.ts with compatibility info
*/

export interface GuardedScope {
  scope: Rule.Node;
  index: number;
}

/**
 * Checks if the given node is used in an if statement, and if it is, returns the
 * scope that the guard applies to and after which index it applies.
 * Should be called with either a bare Identifier or a MemberExpression.
 */
export function determineGuardedScope(node: Rule.Node): GuardedScope | null {
  const result = getIfStatementAndGuardType(node);
  if (!result) return null;

  const [ifStatement, positiveGuard] = result;

  if (positiveGuard) {
    // It's okay to use the identifier inside of the if statement
    return { scope: ifStatement.consequent as Rule.Node, index: 0 };
  }

  if (
    ifStatementHasEarlyReturn(ifStatement) &&
    isBlockOrProgram(ifStatement.parent)
  ) {
    // It's okay to use the identifier after the if statement
    const scope = ifStatement.parent;
    const index = scope.body.indexOf(ifStatement) + 1;
    return { scope, index };
  }

  return null;
}

export function isBlockOrProgram(
  node: Rule.Node
): node is (ESTree.Program | ESTree.BlockStatement) & Rule.NodeParentExtension {
  return node.type === "Program" || node.type === "BlockStatement";
}

function getIfStatementAndGuardType(
  node: Rule.Node
): [ESTree.IfStatement & Rule.NodeParentExtension, boolean] | null {
  let positiveGuard = true;
  let expression: Rule.Node = node;

  if (isUnaryExpression(node.parent, "typeof")) {
    // unused typeof check
    if (node.parent.parent?.type !== "BinaryExpression") return null;

    expression = node.parent.parent;
    // unexpected comparison
    if (!isStringLiteral(expression.right)) return null;

    const operator = expression.operator;
    const right = expression.right.value;

    const operatorIsPositive = operator === "===" || operator === "==";
    const rightIsPositive = right !== "undefined";

    if (
      (operatorIsPositive && rightIsPositive) ||
      (!operatorIsPositive && !rightIsPositive)
    ) {
      // typeof foo === "function"
      // typeof foo !== "undefined"
      positiveGuard = true;
    } else {
      // typeof foo !== "function"
      // typepf foo === "undefined"
      positiveGuard = false;
    }
  } else if (isBinaryExpression(expression.parent, "in")) {
    expression = expression.parent;
  } else if (isBinaryExpression(expression.parent)) {
    if (
      expression.parent.right.type === "Identifier" &&
      expression.parent.right.name === "undefined"
    ) {
    }
  }

  // !window.fetch
  // !!window.fetch
  // !!!!!!window.fetch
  // !(typeof fetch === "undefined")
  while (isUnaryExpression(expression.parent, "!")) {
    expression = expression.parent;
    positiveGuard = !positiveGuard;
  }

  // TODO: allow && checks, but || checks aren't really safe
  // skip over && and || expressions
  while (expression.parent?.type === "LogicalExpression") {
    expression = expression.parent;
  }

  if (expression.parent?.type === "IfStatement") {
    return [expression.parent, positiveGuard];
  }

  return null;
}

function ifStatementHasEarlyReturn(
  node: ESTree.IfStatement & Rule.NodeParentExtension
) {
  return (
    node.consequent.type === "ReturnStatement" ||
    node.consequent.type === "ThrowStatement" ||
    (node.consequent.type === "BlockStatement" &&
      node.consequent.body.some(
        (statement) =>
          statement.type === "ReturnStatement" ||
          statement.type === "ThrowStatement"
      ))
  );
}

export function isInsideTypeofCheck(node: Rule.Node) {
  return (
    node.parent.type === "UnaryExpression" && node.parent.operator === "typeof"
  );
}

function isStringLiteral(
  node: Rule.Node
): node is ESTree.SimpleLiteral & { value: string } & Rule.NodeParentExtension {
  return node.type === "Literal" && typeof node.value === "string";
}

function isBinaryExpression(
  node: Rule.Node,
  operator?: string
): node is ESTree.BinaryExpression & Rule.NodeParentExtension {
  return (
    node.type === "BinaryExpression" &&
    (!operator || node.operator === operator)
  );
}

function isUnaryExpression(
  node: Rule.Node,
  operator?: string
): node is ESTree.UnaryExpression & Rule.NodeParentExtension {
  return (
    node.type === "UnaryExpression" && (!operator || node.operator === operator)
  );
}

export function reverseTargetMappings<K extends string, V extends string>(
  targetMappings: Record<K, V>
): Record<V, K> {
  const reversedEntries = Object.entries(targetMappings).map((entry) =>
    entry.reverse()
  );
  return Object.fromEntries(reversedEntries);
}

export function topmostIdentifierOrMemberExpression(
  node: Rule.Node
):
  | ((ESTree.Identifier | ESTree.MemberExpression) & Rule.NodeParentExtension)
  | null {
  switch (node.type) {
    case "Identifier":
    case "MemberExpression": {
      if (node.parent.type !== "MemberExpression") return node;

      let expression = node.parent;
      while (expression.parent.type === "MemberExpression") {
        expression = expression.parent;
      }

      return expression;
    }

    default:
      return null;
  }
}

interface IdentifierProtoChain {
  protoChain: string[];
  expression: Rule.Node;
}

export function identifierProtoChain(
  node: ESTree.Identifier & Rule.NodeParentExtension
): null | IdentifierProtoChain {
  const result = identifierProtoChainHelper(node);
  if (!result) return null;

  const { expression, protoChain } = result;

  if (
    isBinaryExpression(expression, "in") &&
    isStringLiteral(expression.left)
  ) {
    // e.g. `if ("fetch" in window) {}`
    protoChain.push(expression.left.value);
  }

  return { expression, protoChain };
}

/**
 * Returns an array of property names from the given identifier, without any leading
 * window or globalThis.
 */
function identifierProtoChainHelper(
  node: ESTree.Identifier & Rule.NodeParentExtension
): null | IdentifierProtoChain {
  const expression = topmostIdentifierOrMemberExpression(node);
  if (!expression) return null;

  const protoChain: string[] = [];

  const protoChainFromMemberExpressionObject = (obj: ESTree.Node) => {
    if (obj.type === "Identifier") {
      protoChain.push(obj.name);
      return true;
    }

    if (obj.type === "MemberExpression") {
      if (obj.property.type !== "Identifier") return false;
      if (!protoChainFromMemberExpressionObject(obj.object)) return false;
      protoChain.push(obj.property.name);
      return true;
    }

    return false;
  };

  if (!protoChainFromMemberExpressionObject(expression)) return null;

  if (GLOBALS.includes(protoChain[0])) {
    protoChain.shift();
  }

  return { expression, protoChain };
}

/**
 * Determine the settings to run this plugin with, including the browserslist targets and
 * whether to lint all ES APIs.
 */
export function determineSettings(context: Context) {
  const settings = context.settings;

  // Determine lowest targets from browserslist config, which reads user's
  // package.json config section. Use config from eslintrc for testing purposes
  const browserslistConfig: BrowserListConfig =
    settings.browsers || settings.targets || context.options[0];

  // check for accidental misspellings
  if (!settings.browserslistOpts && (settings as any).browsersListOpts) {
    console.error(
      'Please ensure you spell `browserslistOpts` with a lowercase "l"!'
    );
  }

  const browserslistOpts = settings.browserslistOpts;

  const lintAllEsApis: boolean =
    settings.lintAllEsApis === true ||
    // Attempt to infer polyfilling of ES APIs from babel config
    (!settings.polyfills?.includes("es:all") && !isUsingTranspiler(context));

  const browserslistTargets = parseBrowsersListVersion(
    determineTargetsFromConfig(
      context.filename,
      browserslistConfig,
      browserslistOpts
    )
  );

  return { lintAllEsApis, browserslistTargets };
}

/**
 * Determine the targets based on the browserslist config object
 * Get the targets from the eslint config and merge them with targets in browserslist config
 * Eslint target config will be deprecated in 4.0.0
 *
 * @param configPath - The file or a directory path to look for the browserslist config file
 */
export function determineTargetsFromConfig(
  configPath: string,
  config?: BrowserListConfig,
  browserslistOptsFromConfig?: BrowsersListOpts
): Array<string> {
  const browserslistOpts = { path: configPath, ...browserslistOptsFromConfig };

  const eslintTargets = (() => {
    // Get targets from eslint settings
    if (Array.isArray(config) || typeof config === "string") {
      return browserslist(config, browserslistOpts);
    }
    if (config && typeof config === "object") {
      return browserslist(
        [...(config.production || []), ...(config.development || [])],
        browserslistOpts
      );
    }
    return [];
  })();

  if (browserslist.findConfig(configPath)) {
    // If targets are defined in ESLint and browerslist configs, merge the targets together
    if (eslintTargets.length) {
      const browserslistTargets = browserslist(undefined, browserslistOpts);
      return Array.from(new Set(eslintTargets.concat(browserslistTargets)));
    }
  } else if (eslintTargets.length) {
    return eslintTargets;
  }

  // Get targets fron browserslist configs
  return browserslist(undefined, browserslistOpts);
}

/**
 * Parses the versions that are given by browserslist. They're
 *
 * ```ts
 * parseBrowsersListVersion(['chrome 50'])
 *
 * {
 *   target: 'chrome',
 *   parsedVersion: 50,
 *   version: '50'
 * }
 * ```
 * @param targetslist - List of targest from browserslist api
 * @returns - The lowest version version of each target
 */
export function parseBrowsersListVersion(
  targetslist: Array<string>
): Array<Target> {
  return (
    // Sort the targets by target name and then version number in ascending order
    targetslist
      .map((e: string): Target => {
        const [target, version] = e.split(" ") as [
          keyof TargetNameMappings,
          string,
        ];

        const parsedVersion: number = (() => {
          // If any version === 'all', return 0. The only version of op_mini is 'all'
          if (version === "all") return 0;
          return version.includes("-")
            ? parseFloat(version.split("-")[0])
            : parseFloat(version);
        })();

        return {
          target,
          version,
          parsedVersion,
        };
      }) // Sort the targets by target name and then version number in descending order
      // ex. [a@3, b@3, a@1] => [a@3, a@1, b@3]
      .sort((a: Target, b: Target): number => {
        if (b.target === a.target) {
          return b.parsedVersion - a.parsedVersion;
        }
        return a.target.localeCompare(b.target);
      }) // First last target always has the latest version
      .filter(
        (e: Target, i: number, items: Array<Target>): boolean =>
          // Check if the current target is the last of its kind.
          // If it is, then it's the oldest version.
          i + 1 === items.length || e.target !== items[i + 1].target
      )
  );
}

/**
 * Determine if a user has a babel config, which we use to infer if the linted code is polyfilled.
 */
function isUsingTranspiler(context: Context): boolean {
  const dir = context.filename;
  const configPath = findUp.sync(BABEL_CONFIGS, { cwd: dir });
  if (configPath) return true;

  const pkgPath = findUp.sync("package.json", { cwd: dir });
  if (pkgPath) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    // Check if babel property exists
    return !!pkg.babel;
  }

  return false;
}
