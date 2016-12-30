export type Targets = string[];

export type node = {
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

export type isValidObject = {
  rule: Node | Object, // eslint-disable-line flowtype/no-weak-types
  isValid: bool,
  unsupportedTargets: Array<string>
};
