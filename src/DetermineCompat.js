// @flow
import { rules } from './providers/index';


// @HACK: This is just for testing purposes. Its used to mimic the actual
//        'polyfill' property that will eventually be user configurable. Its
//        hardcoded for now
const tempPolyfills = new Set(['typed-array']);

export type Targets = string[];

export type ESLintNode = {
  type: string,
  callee: {
    type: string,
    computed: bool,
    object: {
      type: string,
      name: string
    },
    property: {
      type: string,
      name: string
    }
  }
}

export type Node = {
  ASTNodeType: string,
  id: string,
  object: string,
  property: string,
  isValid: (
    node: Object,
    eslintNode: ESLintNode,
    targets: string[]
  ) => bool;
}

/**
 * Return false if a if a rule fails
 */
function Validate(eslintNode: ESLintNode): bool {
  // Find the corresponding rules for a eslintNode by it's ASTNodeType
  return rules
    .filter((rule: Node): bool =>
      // Validate ASTNodeType
      rule.ASTNodeType !== eslintNode.type &&
      // Check if polyfill is provided
      !tempPolyfills.has(rule.id)
    )
    .some((rule: Node): bool => rule.isValid(eslintNode));
}

export default Validate;
