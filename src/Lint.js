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
  isValid: (
    node: Node,
    eslintNode: ESLintNode,
    targets: string[]
  ) => bool
};

/**
 * Return false if a if a rule fails
 */
export default function Lint(
  eslintNode: ESLintNode,
  targets: Targets = ['chrome', 'firefox', 'safari', 'edge'],
  polyfills: Set<string> = new Set()): bool {
  // Find the corresponding rules for a eslintNode by it's ASTNodeType
  return rules
    .filter((rule: Node): bool =>
      // Validate ASTNodeType
      rule.ASTNodeType === eslintNode.type &&
      // Check if polyfill is provided
      !polyfills.has(rule.id)
    )
    .every((rule: Node): bool => rule.isValid(rule, eslintNode, targets));
}
