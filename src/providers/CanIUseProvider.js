// @flow
import path from 'path';
import { readFileSync } from 'fs';
import type { Node, ESLintNode, Targets } from '../Lint';


export const supportedTargets: Targets = [
  'chrome', 'firefox', 'opera', 'safari', 'android', 'ie', 'edge',
  'ios_saf', 'op_mini', 'android', 'bb', 'op_mob', 'and_chr', 'and_ff',
  'ie_mob', 'and_uc', 'samsung'
];

function isValid(node: Node, eslintNode: ESLintNode, targets: Targets): bool {
  // Filter non-matching objects and properties
  switch (eslintNode.type) {
    case 'NewExpression':
      if (!eslintNode.callee) return true;
      if (
        eslintNode.callee.name !== node.object
      ) return true;
      break;
    case 'MemberExpression':
      if (!eslintNode.object || !eslintNode.property) return true;
      if (
        eslintNode.object.name !== node.object ||
        eslintNode.property.name !== node.property
      ) return true;
      break;
    default:
      return true;
  }

  // Check the CanIUse database to see if targets are supported
  const caniuseRecord: Object = JSON.parse(
    readFileSync(path.join(__dirname, `./caniuse/features-json/${node.id}.json`)).toString()
  ).stats;

  // Check if targets are supported. By default, get the latest version of each
  // target environment

  return targets.every((target: Object): bool => {
    const sortedVersions =
      Object
        .keys(caniuseRecord[target])
        .sort((a: number, b: number): number => a - b);

    const latestVersion = sortedVersions[sortedVersions.length - 1];
    const latest = caniuseRecord[target][latestVersion];

    return latest !== 'n';
  });
}

const CanIUseProvider: Node[] = [
  // ex. new ServiceWorker()
  {
    id: 'serviceworkers',
    ASTNodeType: 'NewExpression',
    object: 'ServiceWorker',
    isValid
  },
  // ex. document.querySelector()
  {
    id: 'queryselector',
    ASTNodeType: 'MemberExpression',
    object: 'document',
    property: 'querySelector',
    isValid
  },
  // ex. WebAssembly
  {
    id: 'wasm',
    ASTNodeType: 'MemberExpression',
    object: 'WebAssembly',
    property: 'compile',
    isValid
  },
  // ex. document.currentScript()
  {
    id: 'document-currentscript',
    ASTNodeType: 'MemberExpression',
    object: 'document',
    property: 'currentScript',
    isValid
  }
];

export default CanIUseProvider;
