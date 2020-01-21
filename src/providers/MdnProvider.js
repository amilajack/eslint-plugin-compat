import AstMetadata from 'ast-metadata-inferer';
import semver from 'semver';
import type { Node, Targets, Target } from '../LintTypes';

type AstMetadataRecordType = {
  apiType: 'js-api' | 'css-api',
  type: 'js-api' | 'css-api',
  protoChain: Array<string>,
  protoChainId: string,
  astNodeTypes: Array<string>,
  isStatic: boolean,
  compat: {
    support: {
      [browserName: string]: {
        // If a version is true then it is supported but version is unsure
        version_added: string | boolean
      }
    },
    [x: string]: any
  }
};

const mdnRecords: Map<string, AstMetadataRecordType> = new Map(
  AstMetadata.map(e => [e.protoChainId, e])
);

/**
 * Map ids of mdn targets to their "common/friendly" name
 */
const targetNameMappings = {
  chrome: 'Chrome',
  firefox: 'Firefox',
  opera: 'Opera',
  safari: 'Safari',
  ie: 'IE',
  edge: 'Edge',
  safari_ios: 'iOS Safari',
  opera_android: 'Opera Mobile',
  chrome_android: 'Android Chrome',
  edge_mobile: 'Edge Mobile',
  firefox_android: 'Android Firefox',
  webview_android: 'WebView Android',
  samsunginternet_android: 'Samsung Browser',
  nodes: 'Node.js'
};

/**
 * Take a target's id and return it's full name by using `targetNameMappings`
 * ex. {target: and_ff, version: 40} => 'Android FireFox 40'
 */
function formatTargetNames(target: Target): string {
  return `${targetNameMappings[target.target]} ${target.version}`;
}

/**
 * Convert '9' => '9.0.0'
 */
function customCoerce(version: string): string {
  return version.length === 1 ? [version, 0, 0].join('.') : version;
}

/*
 * Return if MDN supports the API or not
 */
export function mdnSupported(node: Node, { version, target }: Target): boolean {
  // If no record could be found, return false. Rules might not
  // be found because they could belong to another provider
  if (!mdnRecords.has(node.protoChainId)) return true;
  const record = mdnRecords.get(node.protoChainId);
  if (!record || !record.compat.support) return true;
  const compatRecord = record.compat.support[target];
  if (!compatRecord) return true;
  if (!Array.isArray(compatRecord) && !('version_added' in compatRecord))
    return true;
  const { version_added: versionAdded } = Array.isArray(compatRecord)
    ? compatRecord.find(e => 'version_added' in e)
    : compatRecord;

  // If a version is true then it is supported but version is unsure
  if (typeof versionAdded === 'boolean') return versionAdded;
  if (versionAdded === null) return true;

  // Special case for Safari TP: TP is always gte than any other releases
  if (target === 'safari') {
    if (version === 'TP') return true;
    if (versionAdded === 'TP') return false;
  }
  // A browser supports an API if its version is greater than or equal
  // to the first version of the browser that API was added in
  const semverCurrent = semver.coerce(customCoerce(version));
  const semverAdded = semver.coerce(customCoerce(versionAdded));

  // semver.coerce() might be null for non-semvers (other than Safari TP)
  // Just treat features as supported here for now to avoid lint from crashing
  if (!semverCurrent || !semverAdded) return true;

  return semver.gte(semverCurrent, semverAdded);
}

/**
 * Return an array of all unsupported targets
 */
export function getUnsupportedTargets(
  node: Node,
  targets: Targets
): Array<string> {
  return targets
    .filter(target => !mdnSupported(node, target))
    .map(formatTargetNames);
}

function getMetadataName(metadata: Node) {
  switch (metadata.protoChain.length) {
    case 1: {
      return metadata.protoChain[0];
    }
    default:
      return `${metadata.protoChain.join('.')}()`;
  }
}

const MdnProvider: Array<Node> = AstMetadata
  // Create entries for each ast node type
  .map(metadata =>
    metadata.astNodeTypes.map(astNodeType => ({
      ...metadata,
      name: getMetadataName(metadata),
      id: metadata.protoChainId,
      protoChainId: metadata.protoChainId,
      astNodeType,
      object: metadata.protoChain[0],
      // @TODO Handle cases where 'prototype' is in protoChain
      property: metadata.protoChain[1]
    }))
  )
  // Flatten the array of arrays
  .reduce((p, c) => [...p, ...c])
  // Add rule and target support logic for each entry
  .map(rule => ({
    ...rule,
    getUnsupportedTargets
  }));

export default MdnProvider;
