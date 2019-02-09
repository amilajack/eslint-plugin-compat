// @flow
// $FlowFixMe: Flow import error
import caniuseRecords from 'caniuse-db/fulldata-json/data-2.0.json';
import type { Node, ESLintNode, Targets, Target } from '../LintTypes';

type TargetMetadata = {
  // The list of targets supported by the provider
  targets: Targets
};

type CanIUseStats = {
  [browser: string]: {
    [version: string]: string
  }
};

type CanIUseRecords = {
  data: CanIUseStats
};

// HACK: modern targets should be determined once at runtime
export const targetMetadata: TargetMetadata = {
  targets: [
    'chrome',
    'firefox',
    'opera',
    'safari',
    'ie',
    'edge',
    'ios_saf',
    'op_mini',
    'android',
    'bb',
    'op_mob',
    'and_chr',
    'and_ff',
    'ie_mob',
    'and_uc',
    'samsung',
    'baidu'
  ]
};

const targetNameMappings = {
  chrome: 'Chrome',
  firefox: 'Firefox',
  opera: 'Opera',
  baidu: 'Baidu',
  and_qq: 'QQ Browser',
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

/**
 * Take a target's id and return it's full name by using `targetNameMappings`
 * ex. {target: and_ff, version: 40} => 'Android FireFox 40'
 */
function formatTargetNames(target: Target): string {
  return `${targetNameMappings[target.target]} ${target.version}`;
}

/**
 * Check if a browser version is in the range format
 * ex. 10.0-10.2
 */
function versionIsRange(version: string): boolean {
  return version.includes('-');
}

/**
 * Parse version from caniuse and compare with parsed version from browserslist.
 */
function compareRanges(targetVersion: number, statsVersion: string): boolean {
  return targetVersion === parseFloat(statsVersion);
}

/*
 * Check the CanIUse database to see if targets are supported
 */
function canIUseIsNotSupported(
  node: Node,
  { version, target, parsedVersion }: Target
): boolean {
  const { stats } = (caniuseRecords: CanIUseRecords).data[node.id];
  const targetStats = stats[target];
  return versionIsRange(version)
    ? Object.keys(targetStats).some(
        (statsVersion: string): boolean =>
          versionIsRange(statsVersion) &&
          compareRanges(parsedVersion, statsVersion)
            ? !targetStats[statsVersion].includes('y')
            : false
      )
    : targetStats[version] && !targetStats[version].includes('y');
}

/**
 * Return an array of all unsupported targets
 */
export function getUnsupportedTargets(
  node: Node,
  targets: Targets
): Array<string> {
  return targets
    .filter(target => canIUseIsNotSupported(node, target))
    .map(formatTargetNames);
}

/**
 * Check if the node has matching object or properties
 */
function isValid(
  node: Node,
  eslintNode: ESLintNode,
  targets: Targets
): boolean {
  switch (eslintNode.type) {
    case 'CallExpression':
    case 'NewExpression':
      if (!eslintNode.callee) return true;
      if (eslintNode.callee.name !== node.object) return true;
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

  return !getUnsupportedTargets(node, targets).length;
}

const CanIUseProvider: Array<Node> = [
  // new ServiceWorker()
  {
    id: 'serviceworkers',
    astNodeType: 'NewExpression',
    object: 'ServiceWorker'
  },
  {
    id: 'serviceworkers',
    astNodeType: 'MemberExpression',
    object: 'navigator',
    property: 'serviceWorker'
  },
  // document.querySelector()
  {
    id: 'queryselector',
    astNodeType: 'MemberExpression',
    object: 'document',
    property: 'querySelector'
  },
  // IntersectionObserver
  {
    id: 'intersectionobserver',
    astNodeType: 'NewExpression',
    object: 'IntersectionObserver'
  },
  // PaymentRequest
  {
    id: 'payment-request',
    astNodeType: 'NewExpression',
    object: 'PaymentRequest'
  },
  // Promises
  {
    id: 'promises',
    astNodeType: 'NewExpression',
    object: 'Promise'
  },
  {
    id: 'promises',
    astNodeType: 'MemberExpression',
    object: 'Promise',
    property: 'resolve'
  },
  {
    id: 'promises',
    astNodeType: 'MemberExpression',
    object: 'Promise',
    property: 'all'
  },
  {
    id: 'promises',
    astNodeType: 'MemberExpression',
    object: 'Promise',
    property: 'race'
  },
  {
    id: 'promises',
    astNodeType: 'MemberExpression',
    object: 'Promise',
    property: 'reject'
  },
  // fetch
  {
    id: 'fetch',
    astNodeType: 'CallExpression',
    object: 'fetch'
  },
  // document.currentScript()
  {
    id: 'document-currentscript',
    astNodeType: 'MemberExpression',
    object: 'document',
    property: 'currentScript'
  },
  // URL
  {
    id: 'url',
    astNodeType: 'NewExpression',
    object: 'URL'
  },
  // URLSearchParams
  {
    id: 'urlsearchparams',
    astNodeType: 'NewExpression',
    object: 'URLSearchParams'
  },
  // performance.now()
  {
    id: 'high-resolution-time',
    astNodeType: 'MemberExpression',
    object: 'performance',
    property: 'now'
  }
].map(rule =>
  Object.assign({}, rule, {
    isValid,
    getUnsupportedTargets
  })
);

export default CanIUseProvider;
