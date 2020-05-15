import AstMetadata from "ast-metadata-inferer";
import semver from "semver";
import {
  STANDARD_TARGET_NAME_MAPPING,
  reverseTargetMappings
} from "../Versioning";
import type { Node, Targets, Target } from "../LintTypes";

// @TODO Import this type from ast-metadata-inferer after migrating this project to TypeScript
type AstMetadataRecordType = {
  apiType: "js-api" | "css-api",
  type: "js-api" | "css-api",
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
const targetIdMappings = {
  chrome: "chrome",
  firefox: "firefox",
  opera: "opera",
  safari: "safari",
  safari_ios: "ios_saf",
  ie: "ie",
  edge_mobile: "ie_mob",
  edge: "edge",
  opera_android: "and_opera",
  chrome_android: "and_chrome",
  firefox_android: "and_firefox",
  webview_android: "and_webview",
  samsunginternet_android: "and_samsung",
  nodejs: "node"
};

const reversedTargetMappings = reverseTargetMappings(targetIdMappings);

/**
 * Take a target's id and return it's full name by using `targetNameMappings`
 * ex. {target: and_ff, version: 40} => 'Android FireFox 40'
 */
function formatTargetNames(target: Target): string {
  return `${STANDARD_TARGET_NAME_MAPPING[target.target]} ${target.version}`;
}

/**
 * Convert '9' => '9.0.0'
 */
function customCoerce(version: string): string {
  return version.length === 1 ? [version, 0, 0].join(".") : version;
}

/*
 * Return if MDN supports the API or not
 */
export function isSupportedByMDN(
  node: Node,
  { version, target: mdnTarget }: Target
): boolean {
  const target = reversedTargetMappings[mdnTarget];
  // If no record could be found, return true. Rules might not
  // be found because they could belong to another provider
  if (!mdnRecords.has(node.protoChainId)) return true;
  const record = mdnRecords.get(node.protoChainId);
  if (!record || !record.compat.support) return true;
  const compatRecord = record.compat.support[target];
  if (!compatRecord) return true;
  if (!Array.isArray(compatRecord) && !("version_added" in compatRecord))
    return true;
  const { version_added: versionAdded } = Array.isArray(compatRecord)
    ? compatRecord.find(e => "version_added" in e)
    : compatRecord;

  // If a version is true then it is supported but version is unsure
  if (typeof versionAdded === "boolean") return versionAdded;
  if (versionAdded === null) return true;

  // Special case for Safari TP: TP is always gte than any other releases
  if (target === "safari") {
    if (version === "TP") return true;
    if (versionAdded === "TP") return false;
  }
  // A browser supports an API if its version is greater than or equal
  // to the first version of the browser that API was added in
  const semverCurrent = semver.coerce(customCoerce(version));
  const semverAdded = semver.coerce(customCoerce(versionAdded));

  // semver.coerce() might be null for non-semvers (other than Safari TP)
  // Just warn and treat features as supported here for now to avoid lint from
  // crashing
  if (!semverCurrent) {
    // eslint-disable-next-line no-console
    console.warn(
      `eslint-plugin-compat: A non-semver target "${target} ${version}" matched for the feature ${node.protoChainId}, skipping. You're welcome to submit this log to https://github.com/amilajack/eslint-plugin-compat/issues for analysis.`
    );
    return true;
  }
  if (!versionAdded) {
    // eslint-disable-next-line no-console
    console.warn(
      `eslint-plugin-compat: The feature ${node.protoChainId} is supported since a non-semver target "${target} ${versionAdded}", skipping. You're welcome to submit this log to https://github.com/amilajack/eslint-plugin-compat/issues for analysis.`
    );
    return true;
  }
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
    .filter(target => !isSupportedByMDN(node, target))
    .map(formatTargetNames);
}

function getMetadataName(metadata: Node) {
  switch (metadata.protoChain.length) {
    case 1: {
      return metadata.protoChain[0];
    }
    default:
      return `${metadata.protoChain.join(".")}()`;
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
  .flat()
  // Add rule and target support logic for each entry
  .map(rule => ({
    ...rule,
    getUnsupportedTargets
  }));

export default MdnProvider;
