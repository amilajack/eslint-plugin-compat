// @flow
import { rules } from './providers/index';


export type Targets = string[];

type node = {
  type?: string,
  name?: string
};

export type ESLintNode = {
  object?: node,
  property?: node,
  callee?: {
    name?: string,
    type?: string,
    computed: bool,
    object?: node,
    property?: node
  }
} & node;

export type Node = {
  ASTNodeType: string,
  id: string,
  object: string,
  property?: string,
  name?: string,
  getUnsupportedTargets: (
    node: Node,
    targets: Targets
  ) => Array<string>,
  isValid: (
    node: Node,
    eslintNode: ESLintNode,
    targets: string[]
  ) => bool
};

type isValidObject = {
  rule: Node | Object, // eslint-disable-line flowtype/no-weak-types
  isValid: bool,
  unsupportedTargets: Array<string>
};

export function generateErrorName(_node: Node): string {
  if (_node.name) return _node.name;
  if (_node.property) return `${_node.object}.${_node.property}()`;
  return _node.object;
}

/**
 * Return false if a if a rule fails
 */
export default function Lint(
  eslintNode: ESLintNode,
  targets: Targets = ['chrome', 'firefox', 'safari', 'edge'],
  polyfills: Set<string> = new Set()): isValidObject {
  // Find the corresponding rules for a eslintNode by it's ASTNodeType
  const failingRule = rules
    .filter((rule: Node): bool =>
      // Validate ASTNodeType
      rule.ASTNodeType === eslintNode.type &&
      // Check if polyfill is provided
      !polyfills.has(rule.id)
    )
    // Find the first failing rule
    .find((rule: Node): bool => !rule.isValid(rule, eslintNode, targets));

  return failingRule
    ? {
      rule: failingRule,
      isValid: false,
      unsupportedTargets: failingRule.getUnsupportedTargets(failingRule, targets)
    }
    : { rule: {}, unsupportedTargets: [], isValid: true };
}
