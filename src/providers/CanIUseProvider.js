// @flow
import path from 'path';
import { readFileSync } from 'fs';
import type { Node, ESLintNode, Targets, Target } from '../LintTypes';


type TargetMetadata = {
  // The list of targets supported by the provider
  targets: Targets
};

type CanIUseRecord = {
  data: {
    [x: string]: {
      [x: string]: string
    }
  }
};

const caniuseRecord: CanIUseRecord = JSON.parse(
  readFileSync(
    path.join(__dirname, './caniuse/fulldata-json/data-2.0.json')
  )
  .toString()
);

// HACK: modern targets should be determined once at runtime
export const targetMetadata: TargetMetadata = {
  targets: [
    'chrome', 'firefox', 'opera', 'safari', 'android', 'ie', 'edge', 'ios_saf',
    'op_mini', 'android', 'bb', 'op_mob', 'and_chr', 'and_ff', 'ie_mob', 'and_uc',
    'samsung'
  ]
};

const targetNameMappings = {
  chrome: 'Chrome',
  firefox: 'Firefox',
  opera: 'Opera',
  safari: 'Safari',
  android: 'Android Browser',
  ie: 'IE',
  edge: 'Edge',
  ios_saf: 'iOS Safari',
  op_mini: 'Opera Mini',
  bb: 'Blackberry Browser',
  op_mob: 'Opera Mobile',
  and_chr: 'Android Chrome',
  and_ff: 'Android Firefox',
  ie_mob: 'IE Mobile',
  and_uc: 'Android UC Browser',
  samsung: 'Samsung Browser'
};

function formatTargetNames(targetName: Target): string {
  return `${targetNameMappings[targetName.target]} ${targetName.version}`;
}

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
      // object is required to determine compatibility
      if (!node.property) break;

      if (eslintNode.property.name !== node.property) return true;
      break;
    default:
      return true;
  }

  return getUnsupportedTargets(node, targets).length === 0;
}

/**
 * Return an array of all unsupported targets
 */
export function getUnsupportedTargets(node: Node, targets: Targets): Array<string> {
  // Check the CanIUse database to see if targets are supported
  const { stats } = caniuseRecord.data[node.id];

  return targets
    .filter(
      (target: Target): bool => stats[target.target][target.version].includes('n')
    )
    .map(formatTargetNames);
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
  // PaymentRequest
  {
    id: 'payment-request',
    ASTNodeType: 'NewExpression',
    object: 'PaymentRequest',
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
