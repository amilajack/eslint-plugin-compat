/* eslint no-nested-ternary: off */
import browserslist from "browserslist";
import {
  AstMetadataApiWithTargetsResolver,
  ESLintNode,
  BrowserListConfig,
  Target,
  HandleFailingRule,
  Context,
} from "./types";
import { TargetNameMappings } from "./constants";

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
  node: ESLintNode
) {
  if (!isInsideIfStatement(context)) {
    handleFailingRule(failingRule, node);
  }
}

export function lintCallExpression(
  context: Context,
  handleFailingRule: HandleFailingRule,
  rules: AstMetadataApiWithTargetsResolver[],
  node: ESLintNode
) {
  if (!node.callee) return;
  const calleeName = node.callee.name;
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
  node: ESLintNode
) {
  if (!node.callee) return;
  const calleeName = node.callee.name;
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
  node: ESLintNode
) {
  if (!node?.expression?.name) return;
  const failingRule = rules.find(
    (rule) => rule.object === node?.expression?.name
  );
  if (failingRule)
    checkNotInsideIfStatementAndReport(
      context,
      handleFailingRule,
      failingRule,
      node
    );
}

function protoChainFromMemberExpression(node: ESLintNode): string[] {
  if (!node.object) return [node.name];
  const protoChain = (() => {
    switch (node.object.type) {
      case "NewExpression":
      case "CallExpression":
        return protoChainFromMemberExpression(node.object.callee!);
      default:
        return protoChainFromMemberExpression(node.object);
    }
  })();
  return [...protoChain, node.property!.name];
}

export function lintMemberExpression(
  context: Context,
  handleFailingRule: HandleFailingRule,
  rules: Array<AstMetadataApiWithTargetsResolver>,
  node: ESLintNode
) {
  if (!node.object || !node.property) return;
  if (
    !node.object.name ||
    node.object.name === "window" ||
    node.object.name === "globalThis"
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
    const objectName = node.object.name;
    const propertyName = node.property.name;
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
 * Determine the targets based on the browserslist config object
 * Get the targets from the eslint config and merge them with targets in browserslist config
 * Eslint target config will be deprecated in 4.0.0
 *
 * @param configPath - The file or a directory path to look for the browserslist config file
 */
export function determineTargetsFromConfig(
  configPath: string,
  config?: BrowserListConfig
): Array<string> {
  const browserslistOpts = { path: configPath };

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
          number | string
        ];

        const parsedVersion: number = (() => {
          if (typeof version === "number") return version;
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
          // If any version === 'all', return 0. The only version of op_mini is 'all'
          // Otherwise, compare the versions
          return typeof b.parsedVersion === "string" ||
            typeof a.parsedVersion === "string"
            ? 0
            : b.parsedVersion - a.parsedVersion;
        }
        return b.target > a.target ? 1 : -1;
      }) // First last target always has the latest version
      .filter(
        (e: Target, i: number, items: Array<Target>): boolean =>
          // Check if the current target is the last of its kind.
          // If it is, then it's the most recent version.
          i + 1 === items.length || e.target !== items[i + 1].target
      )
  );
}
