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

export const supportedTargets: Targets = [
  'chrome', 'firefox', 'opera', 'safari', 'android', 'ie', 'edge', 'ios_saf',
  'op_mini', 'android', 'bb', 'op_mob', 'and_chr', 'and_ff', 'ie_mob', 'and_uc',
  'samsung'
];

function isValid(node: Node, eslintNode: ESLintNode, targets: Targets): bool {
  // Filter non-matching objects and properties
  switch (eslintNode.type) {
    case 'CallExpression':
      if (!eslintNode.callee) return true;
      if (
        eslintNode.callee.name !== node.object
      ) return true;
      break;
    case 'NewExpression':
      if (!eslintNode.callee) return true;
      if (
        eslintNode.callee.name !== node.object
      ) return true;
      break;
    case 'MemberExpression':
      // Pass tests if non-matching object or property
      if (!eslintNode.object || !eslintNode.property) return true;
      if (eslintNode.object.name !== node.object) return true;

      // If the property is missing from the rule, it means that only the
      // object is required to determine compatability
      if (!node.property) break;

      if (eslintNode.property.name !== node.property) return true;
      break;
    default:
      return true;
  }

  return getUnsupportedTargets(node, targets).length === 0;
}

// TODO: Refactor record retrival from isValid. This will make finding the
//       unsupported browsers of a specific rule much easier. isValid can
//       return a bool and getUnsupportedEnv can return array of unsupported
//       environments

/**
 * Return an array of all unsupported targets
 */
export function getUnsupportedTargets(node: Node, targets: Targets): Array<string> {
  // Check the CanIUse database to see if targets are supported
  const caniuseRecord: CanIUseRecord = JSON.parse(
    readFileSync(path.join(
      __dirname,
      `./caniuse/features-json/${node.id}.json`
    )).toString()
  ).stats;

  // Check if targets are supported. By default, get the latest version of each
  // target environment
  return targets.filter((target: string): bool => {
    const sortedVersions =
      Object
        // HACK: Sort strings by number value, ex. '12' - '2' === '10'
        .keys(caniuseRecord[target]) // eslint-disable-line
        .sort((a: number, b: number): number => a - b);

    const latestVersion = sortedVersions[sortedVersions.length - 1];
    const latest = caniuseRecord[target][latestVersion];

    return latest === 'n';
  });
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
    isValid,
    getUnsupportedTargets
  },
  {
    id: 'serviceworkers',
    ASTNodeType: 'MemberExpression',
    object: 'navigator',
    property: 'serviceWorker',
    isValid,
    getUnsupportedTargets
  },
  // document.querySelector()
  {
    id: 'queryselector',
    ASTNodeType: 'MemberExpression',
    object: 'document',
    property: 'querySelector',
    isValid,
    getUnsupportedTargets
  },
  // WebAssembly
  {
    id: 'wasm',
    ASTNodeType: 'MemberExpression',
    object: 'WebAssembly',
    isValid,
    getUnsupportedTargets
  },
  // IntersectionObserver
  {
    id: 'intersectionobserver',
    ASTNodeType: 'NewExpression',
    object: 'IntersectionObserver',
    isValid,
    getUnsupportedTargets
  },
  // fetch
  {
    id: 'fetch',
    ASTNodeType: 'CallExpression',
    object: 'fetch',
    isValid,
    getUnsupportedTargets
  },
  // document.currentScript()
  {
    id: 'document-currentscript',
    ASTNodeType: 'MemberExpression',
    object: 'document',
    property: 'currentScript',
    isValid,
    getUnsupportedTargets
  }
];

export default CanIUseProvider;
