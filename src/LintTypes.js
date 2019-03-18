// @flow
export type node = {
  type?: 'MemberExpression' | 'NewExpression' | 'CallExpression',
  name?: string,
  object: string,
  property: string | void,
  protoChainId: string,
  protoChain: Array<string>
};

export type Target = {
  target: string,
  version: number | string | 'all'
};

export type Targets = Array<string>;

export type ESLintNode = {
  object?: node,
  property?: node,
  callee?: {
    name?: string,
    type?: string,
    computed: boolean,
    object?: node,
    property?: node
  }
} & node;

export type Node = {
  astNodeType: string,
  id: string,
  object: string,
  property?: string,
  name?: string,
  getUnsupportedTargets: (node: Node, targets: Targets) => Array<string>,
  isValid: (
    node: Node,
    eslintNode: ESLintNode,
    targets: Array<string>
  ) => boolean
};

export type isValidObject = {
  rule: Node,
  isValid: boolean,
  unsupportedTargets: Array<string>
};
