// @flow
import path from 'path';
import { readFileSync } from 'fs';
import type { Node, ESLintNode, Targets } from '../Lint';


// HACK: modern targets should be determined once at runtime
export const modern = ['chrome >= 50', 'safari >= 8', 'firefox >= 44'];

type CanIUseRecord = {
  [x: string]: {
    [x: string]: string
  }
};

export type isValidMessage = {
  error: bool,
  message: string
};

export const supportedTargets: Targets = [
  'chrome', 'firefox', 'opera', 'safari', 'android', 'ie', 'edge', 'ios_saf',
  'op_mini', 'android', 'bb', 'op_mob', 'and_chr', 'and_ff', 'ie_mob', 'and_uc',
  'samsung'
];

function generateErrorName(node: Node): string {
  if (node.name) return node.name;
  if (node.property) return `${node.object}.${node.property}()`;
  return node.object;
}

const isValidObject = {
  message: 'Supported',
  error: false
};

function isValid(node: Node, eslintNode: ESLintNode, targets: Targets): isValidMessage {
  // Filter non-matching objects and properties
  switch (eslintNode.type) {
    case 'CallExpression':
      if (!eslintNode.callee) return isValidObject;
      if (
        eslintNode.callee.name !== node.object
      ) return isValidObject;
      break;
    case 'NewExpression':
      if (!eslintNode.callee) return isValidObject;
      if (
        eslintNode.callee.name !== node.object
      ) return isValidObject;
      break;
    case 'MemberExpression':
      // Pass tests if non-matching object or property
      if (!eslintNode.object || !eslintNode.property) return isValidObject;
      if (eslintNode.object.name !== node.object) return isValidObject;

      // If the property is missing from the rule, it means that only the
      // object is required to determine compatability
      if (!node.property) break;

      if (eslintNode.property.name !== node.property) return isValidObject;
      break;
    default:
      return isValidObject;
  }

  // Check the CanIUse database to see if targets are supported
  const caniuseRecord: CanIUseRecord = JSON.parse(
    readFileSync(path.join(
      __dirname,
      `./caniuse/features-json/${node.id}.json`
    )).toString()
  ).stats;

  // Check if targets are supported. By default, get the latest version of each
  // target environment
  const ifTargetsSupported = targets.every((target: string): bool => {
    const sortedVersions =
      Object
        // HACK: Sort strings by number value, ex. '12' - '2' === '10'
        .keys(caniuseRecord[target]) // eslint-disable-line
        .sort((a: number, b: number): number => a - b);

    const latestVersion = sortedVersions[sortedVersions.length - 1];
    const latest = caniuseRecord[target][latestVersion];

    return latest !== 'n';
  });

  return ifTargetsSupported
    ? isValidObject
    : {
      message: `${generateErrorName(node)} is not supported in`,
      error: true
    };
}

//
// TODO: Refactor to separate module
// TODO: Refactor isValid(), remove from rules
//

const CanIUseProvider: Node[] = [
  // new ServiceWorker()
  {
    id: 'serviceworkers',
    ASTNodeType: 'NewExpression',
    object: 'ServiceWorker',
    name: 'ServiceWorker',
    isValid
  },
  {
    id: 'serviceworkers',
    ASTNodeType: 'MemberExpression',
    object: 'navigator',
    property: 'serviceWorker',
    name: 'ServiceWorker',
    isValid
  },
  // document.querySelector()
  {
    id: 'queryselector',
    ASTNodeType: 'MemberExpression',
    object: 'document',
    property: 'querySelector',
    name: 'document.querySelector()',
    isValid
  },
  // WebAssembly
  {
    id: 'wasm',
    ASTNodeType: 'MemberExpression',
    object: 'WebAssembly',
    isValid
  },
  // IntersectionObserver
  {
    id: 'intersectionobserver',
    ASTNodeType: 'NewExpression',
    object: 'IntersectionObserver',
    isValid
  },
  // fetch
  {
    id: 'fetch',
    ASTNodeType: 'CallExpression',
    object: 'fetch',
    isValid
  },
  // document.currentScript()
  {
    id: 'document-currentscript',
    ASTNodeType: 'MemberExpression',
    object: 'document',
    property: 'currentScript',
    isValid
  }
];

export default CanIUseProvider;
