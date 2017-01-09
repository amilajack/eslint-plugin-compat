export type node = {
  type?: string,
  name?: string
};

export type Target = {
  target: string,
  version: number | string | 'all'
};

export type Targets = Array<Target>;

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
  rule: Node,
  isValid: bool,
  unsupportedTargets: Array<string>
};
