// @flow
// $FlowFixMe: Flow import error
import caniuseRecords from 'caniuse-db/fulldata-json/data-2.0.json';
import type { Node, Targets, Target } from '../LintTypes';

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
  const { stats } = (caniuseRecords: CanIUseRecords).data[node.caniuseId];
  const targetStats = stats[target];
  return versionIsRange(version)
    ? Object.keys(targetStats).some((statsVersion: string): boolean =>
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

const CanIUseProvider: Array<Node> = [
  // new ServiceWorker()
  {
    caniuseId: 'serviceworkers',
    astNodeType: 'NewExpression',
    object: 'ServiceWorker'
  },
  {
    caniuseId: 'serviceworkers',
    astNodeType: 'MemberExpression',
    object: 'navigator',
    property: 'serviceWorker'
  },
  // document.querySelector()
  {
    caniuseId: 'queryselector',
    astNodeType: 'MemberExpression',
    object: 'document',
    property: 'querySelector'
  },
  // IntersectionObserver
  {
    caniuseId: 'intersectionobserver',
    astNodeType: 'NewExpression',
    object: 'IntersectionObserver'
  },
  // ResizeObserver
  {
    caniuseId: 'resizeobserver',
    astNodeType: 'NewExpression',
    object: 'ResizeObserver'
  },
  // PaymentRequest
  {
    caniuseId: 'payment-request',
    astNodeType: 'NewExpression',
    object: 'PaymentRequest'
  },
  // Promises
  {
    caniuseId: 'promises',
    astNodeType: 'NewExpression',
    object: 'Promise'
  },
  {
    caniuseId: 'promises',
    astNodeType: 'MemberExpression',
    object: 'Promise',
    property: 'resolve'
  },
  {
    caniuseId: 'promises',
    astNodeType: 'MemberExpression',
    object: 'Promise',
    property: 'all'
  },
  {
    caniuseId: 'promises',
    astNodeType: 'MemberExpression',
    object: 'Promise',
    property: 'race'
  },
  {
    caniuseId: 'promises',
    astNodeType: 'MemberExpression',
    object: 'Promise',
    property: 'reject'
  },
  // fetch
  {
    caniuseId: 'fetch',
    astNodeType: 'CallExpression',
    object: 'fetch'
  },
  // document.currentScript()
  {
    caniuseId: 'document-currentscript',
    astNodeType: 'MemberExpression',
    object: 'document',
    property: 'currentScript'
  },
  // URL
  {
    caniuseId: 'url',
    astNodeType: 'NewExpression',
    object: 'URL'
  },
  // URLSearchParams
  {
    caniuseId: 'urlsearchparams',
    astNodeType: 'NewExpression',
    object: 'URLSearchParams'
  },
  // performance.now()
  {
    caniuseId: 'high-resolution-time',
    astNodeType: 'MemberExpression',
    object: 'performance',
    property: 'now'
  },
  {
    caniuseId: 'typedarrays',
    astNodeType: 'NewExpression',
    object: 'TypedArray'
  },
  {
    caniuseId: 'typedarrays',
    astNodeType: 'NewExpression',
    object: 'Int8Array'
  },
  {
    caniuseId: 'typedarrays',
    astNodeType: 'NewExpression',
    object: 'Uint8Array'
  },
  {
    caniuseId: 'typedarrays',
    astNodeType: 'NewExpression',
    object: 'Uint8ClampedArray'
  },
  {
    caniuseId: 'typedarrays',
    astNodeType: 'NewExpression',
    object: 'Int16Array'
  },
  {
    caniuseId: 'typedarrays',
    astNodeType: 'NewExpression',
    object: 'Uint16Array'
  },
  {
    caniuseId: 'typedarrays',
    astNodeType: 'NewExpression',
    object: 'Int32Array'
  },
  {
    caniuseId: 'typedarrays',
    astNodeType: 'NewExpression',
    object: 'Uint32Array'
  },
  {
    caniuseId: 'typedarrays',
    astNodeType: 'NewExpression',
    object: 'Float32Array'
  },
  {
    caniuseId: 'typedarrays',
    astNodeType: 'NewExpression',
    object: 'Float64Array'
  }
].map(rule =>
  Object.assign({}, rule, {
    getUnsupportedTargets,
    id: rule.property ? `${rule.object}.${rule.property}` : rule.object,
    protoChainId: rule.property
      ? `${rule.object}.${rule.property}`
      : rule.object,
    protoChain: rule.property ? [rule.object, rule.property] : [rule.object]
  })
);

export default CanIUseProvider;
