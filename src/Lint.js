// @flow
import builtInRecords from './providers';
import type { Node, ESLintNode, TargetListItem } from './LintTypes';

export function generateErrorName(_node: Node): string {
  if (_node.name) return _node.name;
  if (_node.property) return `${_node.object}.${_node.property}()`;
  return _node.object;
}

type RuleResult = {
  rule: Object,
  recordMatchesNode: boolean,
  unsupportedTargets: Array<string>
};

/**
 * Return false if a if a rule fails
 *
 * TODO: Eventually, targets will default to 'modern', ('chrome@50', safari@8)
 *       See https://github.com/amilajack/eslint-plugin-compat/wiki#release-200
 */
export default function Lint(
  eslintNode: ESLintNode,
  targets: Array<TargetListItem>,
  polyfills: Set<string>,
  customUserRecords: Array<Node>
): RuleResult {
  // Find the corresponding rules for a eslintNode by it's astNodeType
  const failingRule = ([...builtInRecords, ...customUserRecords]: Array<Node>)
    .filter(
      (rule: Node): boolean =>
        rule.astNodeType === eslintNode.type &&
        // v2 allowed users to select polyfills based off their caniuseId. This is
        // no longer supported. Keeping this here to avoid breaking changes.
        !polyfills.has(rule.id) &&
        // Check if polyfill is provided (ex. `Promise.all`)
        !polyfills.has(rule.protoChainId) &&
        // Check if entire API is polyfilled (ex. `Promise`)
        !polyfills.has(rule.protoChain[0])
    )
    // Find the first failing rule
    .find(
      (node: Node): boolean =>
        !node.recordMatchesNode(node, eslintNode, targets)
    );

  return failingRule
    ? {
        rule: failingRule,
        recordMatchesNode: false,
        unsupportedTargets: failingRule.getUnsupportedTargets(
          failingRule,
          targets
        )
      }
    : {
        rule: {},
        unsupportedTargets: [],
        recordMatchesNode: true
      };
}
