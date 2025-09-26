/* eslint no-nested-ternary: off */
import browserslist from "browserslist";
import { AstNodeTypes, TargetNameMappings } from "./constants";
import {
  AstMetadataApiWithTargetsResolver,
  BrowserListConfig,
  BrowsersListOpts,
  Context,
  ESLintNode,
  HandleFailingRule,
  SourceCode,
  Target,
} from "./types";

/*
3) Figures out which browsers user is targeting

- Uses browserslist config and/or targets defined eslint config to discover this
- For every API ecnountered during traversal, gets compat record for that
- Protochain (e.g. 'document.querySelector')
  - All of the rules have compatibility info attached to them
- Each API is given to versioning.ts with compatibility info
*/
function isInsideIfStatement(
  node: ESLintNode,
  sourceCode: SourceCode,
  context: Context
) {
  // Handle both ESLint 8 and 9 - getAncestors moved from context to sourceCode
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ancestors: any;
  if ("getAncestors" in sourceCode) {
    // @ts-expect-error - ESLint 9+ uses sourceCode.getAncestors
    ancestors = sourceCode?.getAncestors?.(node);
  } else {
    // ESLint 8 uses context.getAncestors - cast to any for compatibility
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ancestors = (context as any).getAncestors?.();
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ancestors?.some((ancestor: any) => {
    return ancestor.type === "IfStatement";
  });
}

function checkNotInsideIfStatementAndReport(
  context: Context,
  handleFailingRule: HandleFailingRule,
  failingRule: AstMetadataApiWithTargetsResolver,
  sourceCode: SourceCode,
  node: ESLintNode
) {
  if (!isInsideIfStatement(node, sourceCode, context)) {
    handleFailingRule(failingRule, node);
  }
}

export function lintCallExpression(
  context: Context,
  handleFailingRule: HandleFailingRule,
  rules: AstMetadataApiWithTargetsResolver[],
  sourceCode: SourceCode,
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
      sourceCode,
      node
    );
}

export function lintNewExpression(
  context: Context,
  handleFailingRule: HandleFailingRule,
  rules: Array<AstMetadataApiWithTargetsResolver>,
  sourceCode: SourceCode,
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
      sourceCode,
      node
    );
}

export function lintExpressionStatement(
  context: Context,
  handleFailingRule: HandleFailingRule,
  rules: AstMetadataApiWithTargetsResolver[],
  sourceCode: SourceCode,
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
      sourceCode,
      node
    );
}

function checkRegexpLiteral(node: ESLintNode): boolean {
  return (
    node.type === AstNodeTypes.Literal &&
    (!!node.regex || node.parent?.callee?.name === "RegExp")
  );
}

export function lintLiteral(
  context: Context,
  handleFailingRule: HandleFailingRule,
  rules: AstMetadataApiWithTargetsResolver[],
  sourceCode: SourceCode,
  node: ESLintNode
) {
  const isRegexpLiteral = checkRegexpLiteral(node);
  const failingRule = rules.find((rule) =>
    rule.syntaxes?.some(
      (syntax) => (isRegexpLiteral ? node.raw.includes(syntax) : false) // non-regexp literals are not supported yet
    )
  );
  if (failingRule) handleFailingRule(failingRule, node);
}

function isStringLiteral(node: ESLintNode): boolean {
  return node.type === AstNodeTypes.Literal && typeof node.value === "string";
}

function protoChainFromMemberExpression(node: ESLintNode): string[] {
  if (!node.object) return [node.name];
  const protoChain = (() => {
    if (
      node.object.type === "NewExpression" ||
      node.object.type === "CallExpression"
    ) {
      return protoChainFromMemberExpression(node.object.callee!);
    } else if (node.object.type === "ArrayExpression") {
      return ["Array"];
    } else if (isStringLiteral(node.object)) {
      return ["String"];
    } else {
      return protoChainFromMemberExpression(node.object);
    }
  })();
  return [...protoChain, node.property!.name];
}

export function lintMemberExpression(
  context: Context,
  handleFailingRule: HandleFailingRule,
  rules: Array<AstMetadataApiWithTargetsResolver>,
  sourceCode: SourceCode,
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
        sourceCode,
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
        sourceCode,
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
  config?: BrowserListConfig,
  browserslistOptsFromConfig?: BrowsersListOpts
): Array<string> {
  const browserslistOpts = { path: configPath, ...browserslistOptsFromConfig };

  const eslintTargets = (() => {
    const query = config
      ? Array.isArray(config) || typeof config === "string"
        ? config
        : "query" in config
        ? config.query
        : [...(config.production || []), ...(config.development || [])]
      : [];
    return query.length ? browserslist(query, browserslistOpts) : [];
  })();

  // Determine if targets picked up by browserslist should be included
  const ignoreBrowserslistTargets =
    config && "object" === typeof config && "query" in config
      ? Boolean(config.ignoreBrowserslistTargets)
      : // Included for backwards-compatibility; remove in next major version (return false instead)
        !browserslist.findConfig(configPath) && eslintTargets.length > 0;

  if (ignoreBrowserslistTargets) {
    return eslintTargets;
  }

  // Get targets fron browserslist configs
  const browserslistTargets = browserslist(undefined, browserslistOpts);

  // If targets are defined in ESLint and browerslist configs, merge the targets together
  return Array.from(new Set(eslintTargets.concat(browserslistTargets)));
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
          number | string,
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
