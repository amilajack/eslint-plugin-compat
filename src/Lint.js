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
  isValid: (
    node: Node,
    eslintNode: ESLintNode,
    targets: string[]
  ) => bool
};

type isValidObject = {
  rule: Node | bool,
  isValid: bool
};

/**
 * Return false if a if a rule fails
 */
export default function Lint(
  eslintNode: ESLintNode,
  targets: Targets = ['chrome', 'firefox', 'safari', 'edge'],
  polyfills: Set<string> = new Set()): isValidObject {
  // Find the corresponding rules for a eslintNode by it's ASTNodeType
  const foundFailingRule = rules
    .filter((rule: Node): bool =>
      // Validate ASTNodeType
      rule.ASTNodeType === eslintNode.type &&
      // Check if polyfill is provided
      !polyfills.has(rule.id)
    )
    // Find the first failing rule
    .find((rule: Node): bool => !rule.isValid(rule, eslintNode, targets));

  return foundFailingRule
    ? { rule: foundFailingRule, isValid: false }
    : { rule: false, isValid: true };
}
