// @flow
type node = {
  ASTNodeType: string,
  object: string,
  property: string
}

export function Provider(_node: node): bool {
  // Check if polyfill is provided
  global.doo = _node.object + {};
}

export default {
  'typed-array': {
    ASTNodeType: 'CallExpression',
    object: 'document',
    property: 'ServiceWorker'
  },
  'document-queryselector': {
    ASTNodeType: 'CallExpression',
    global: 'document',
    property: 'querySelector'
  }
};
