// @flow
// $FlowFixMe: Flow import error
import caniuseRecord from 'caniuse-db/fulldata-json/data-2.0.json'; // eslint-disable-line
import type { Node, ESLintNode, Targets, Target } from '../LintTypes';


type TargetMetadata = {
  // The list of targets supported by the provider
  targets: Targets
};

type CanIUseRecord = {
  data: {
    [browser: string]: {
      [version: string]: string
    }
  }
};

// HACK: modern targets should be determined once at runtime
export const targetMetadata: TargetMetadata = {
  targets: [
    'chrome', 'firefox', 'opera', 'safari', 'ie', 'edge', 'ios_saf',
    'op_mini', 'android', 'bb', 'op_mob', 'and_chr', 'and_ff', 'ie_mob', 'and_uc',
    'samsung', 'baidu'
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
 * Check version for the range format.
 * ex. 10.0-10.2
 */
function versionIsRange(version: string): bool {
  return version.includes('-');
}

/**
 * Parse version from caniuse and compare with parsed version from browserslist.
 */
function compareRanges(targetVersion: number, statsVersion: string): bool {
  return targetVersion === parseFloat(statsVersion);
}

/**
 * Return an array of all unsupported targets
 */
export function getUnsupportedTargets(node: Node, targets: Targets): Array<string> {
  // Check the CanIUse database to see if targets are supported
  const { stats } = (caniuseRecord: CanIUseRecord).data[node.id];

  return targets.filter((target: Target): bool => {
    const { version } = target;
    const targetStats = stats[target.target];

    return (versionIsRange(version))
      ? Object.keys(targetStats).some((statsVersion: string): bool =>
        ((versionIsRange(statsVersion) && compareRanges(target.parsedVersion, statsVersion))
          ? !targetStats[statsVersion].includes('y')
          : false))
      : targetStats[version] && !targetStats[version].includes('y');
  })
    .map(formatTargetNames);
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

//
// TODO: Migrate to compat-db
// TODO: Refactor isValid(), remove from rules
//

const CanIUseProvider: Array<Node> = [
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
  // Promises
  {
    id: 'promises',
    ASTNodeType: 'NewExpression',
    object: 'Promise',
    isValid,
    getUnsupportedTargets
  },
  {
    id: 'promises',
    ASTNodeType: 'MemberExpression',
    object: 'Promise',
    property: 'resolve',
    isValid,
    getUnsupportedTargets
  },
  {
    id: 'promises',
    ASTNodeType: 'MemberExpression',
    object: 'Promise',
    property: 'all',
    isValid,
    getUnsupportedTargets
  },
  {
    id: 'promises',
    ASTNodeType: 'MemberExpression',
    object: 'Promise',
    property: 'race',
    isValid,
    getUnsupportedTargets
  },
  {
    id: 'promises',
    ASTNodeType: 'MemberExpression',
    object: 'Promise',
    property: 'reject',
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
  },
  // URL
  {
    id: 'url',
    ASTNodeType: 'NewExpression',
    object: 'URL',
    isValid,
    getUnsupportedTargets
  },
  // URLSearchParams
  {
    id: 'urlsearchparams',
    ASTNodeType: 'NewExpression',
    object: 'URLSearchParams',
    isValid,
    getUnsupportedTargets
  }
];

export default CanIUseProvider;
