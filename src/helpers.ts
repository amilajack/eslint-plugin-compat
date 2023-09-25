import fs from "fs";

import browserslist from "browserslist";
import { Rule } from "eslint";
import type * as ESTree from "estree";
import findUp from "find-up";

import {
  AstMetadataApiWithTargetsResolver,
  BrowserListConfig,
  Target,
  HandleFailingRule,
  Context,
  BrowsersListOpts,
} from "./types";
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

/*
3) Figures out which browsers user is targeting

- Uses browserslist config and/or targets defined eslint config to discover this
- For every API ecnountered during traversal, gets compat record for that
- Protochain (e.g. 'document.querySelector')
  - All of the rules have compatibility info attached to them
- Each API is given to versioning.ts with compatibility info
*/
function isInsideIfStatement(context: Context) {
  return context.getAncestors().some((ancestor) => {
    return ancestor.type === "IfStatement";
  });
}

function checkNotInsideIfStatementAndReport(
  context: Context,
  handleFailingRule: HandleFailingRule,
  failingRule: AstMetadataApiWithTargetsResolver,
  node: Rule.Node
) {
  if (!isInsideIfStatement(context)) {
    handleFailingRule(failingRule, node);
  }
}

export function lintCallExpression(
  context: Context,
  handleFailingRule: HandleFailingRule,
  rules: AstMetadataApiWithTargetsResolver[],
  node: ESTree.CallExpression & Rule.NodeParentExtension
) {
  if (!node.callee) return;
  const calleeName = (node.callee as any).name;
  const failingRule = rules.find((rule) => rule.object === calleeName);
  if (failingRule)
    checkNotInsideIfStatementAndReport(
      context,
      handleFailingRule,
      failingRule,
      node
    );
}

export function lintNewExpression(
  context: Context,
  handleFailingRule: HandleFailingRule,
  rules: Array<AstMetadataApiWithTargetsResolver>,
  node: ESTree.NewExpression & Rule.NodeParentExtension
) {
  if (!node.callee) return;
  const calleeName = (node.callee as any).name;
  const failingRule = rules.find((rule) => rule.object === calleeName);
  if (failingRule)
    checkNotInsideIfStatementAndReport(
      context,
      handleFailingRule,
      failingRule,
      node
    );
}

export function lintExpressionStatement(
  context: Context,
  handleFailingRule: HandleFailingRule,
  rules: AstMetadataApiWithTargetsResolver[],
  node: ESTree.ExpressionStatement & Rule.NodeParentExtension
) {
  if (!(node?.expression as any)?.name) return;
  const failingRule = rules.find(
    (rule) => rule.object === (node?.expression as any)?.name
  );
  if (failingRule)
    checkNotInsideIfStatementAndReport(
      context,
      handleFailingRule,
      failingRule,
      node
    );
}

function isStringLiteral(
  node: ESTree.Node
): node is Omit<ESTree.SimpleLiteral, "value"> & { value: string } {
  return node.type === "Literal" && typeof node.value === "string";
}

function protoChainFromMemberExpression(
  node: ESTree.MemberExpression
): string[] {
  if (!node.object) return [(node as any).name];
  const protoChain = (() => {
    if (
      node.object.type === "NewExpression" ||
      node.object.type === "CallExpression"
    ) {
      return protoChainFromMemberExpression(
        node.object.callee! as ESTree.MemberExpression
      );
    } else if (node.object.type === "ArrayExpression") {
      return ["Array"];
    } else if (isStringLiteral(node.object)) {
      return ["String"];
    } else {
      return protoChainFromMemberExpression(
        node.object as ESTree.MemberExpression
      );
    }
  })();
  return [...protoChain, (node.property as any).name];
}

export function lintMemberExpression(
  context: Context,
  handleFailingRule: HandleFailingRule,
  rules: Array<AstMetadataApiWithTargetsResolver>,
  node: ESTree.MemberExpression & Rule.NodeParentExtension
) {
  if (!node.object || !node.property) return;
  if (
    !(node.object as any).name ||
    (node.object as any).name === "window" ||
    (node.object as any).name === "globalThis"
  ) {
    const rawProtoChain = protoChainFromMemberExpression(node);
    const [firstObj] = rawProtoChain;
    const protoChain =
      firstObj === "window" || firstObj === "globalThis"
        ? rawProtoChain.slice(1)
        : rawProtoChain;
    const protoChainId = protoChain.join(".");
    const failingRule = rules.find(
      (rule) => rule.protoChainId === protoChainId
    );
    if (failingRule) {
      checkNotInsideIfStatementAndReport(
        context,
        handleFailingRule,
        failingRule,
        node
      );
    }
  } else {
    const objectName = (node.object as any).name;
    const propertyName = (node.property as any).name;
    const failingRule = rules.find(
      (rule) =>
        rule.object === objectName &&
        (rule.property == null || rule.property === propertyName)
    );
    if (failingRule)
      checkNotInsideIfStatementAndReport(
        context,
        handleFailingRule,
        failingRule,
        node
      );
  }
}

export function reverseTargetMappings<K extends string, V extends string>(
  targetMappings: Record<K, V>
): Record<V, K> {
  const reversedEntries = Object.entries(targetMappings).map((entry) =>
    entry.reverse()
  );
  return Object.fromEntries(reversedEntries);
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
      context.getFilename(),
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
  const dir = context.getFilename();
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
