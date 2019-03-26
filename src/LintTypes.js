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

export type TargetListItem = {
  target: string,
  parsedVersion: number,
  version: string | 'all'
};

export type Node = {
  astNodeType: string,
  id: string,
  caniuseId: string,
  protoChain: string[],
  protoChainId: string,
  object: string,
  property?: string,
  name?: string,
  getUnsupportedTargets: (
    node: Node,
    targets: Array<TargetListItem>
  ) => Array<string>,
  recordMatchesNode: (
    node: Node,
    eslintNode: ESLintNode,
    targets: Array<TargetListItem>
  ) => boolean
};

export type RecordMatchesNode = {
  rule: Node,
  recordMatchesNode: boolean,
  unsupportedTargets: Array<string>
};
