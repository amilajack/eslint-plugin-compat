/* eslint no-nested-ternary: off */

import browserslist from "browserslist";
import { BrowserListConfig } from "./types";

export const STANDARD_TARGET_NAME_MAPPING = {
  chrome: "Chrome",
  firefox: "Firefox",
  safari: "Safari",
  ios_saf: "iOS Safari",
  ie: "IE",
  ie_mob: "IE Mobile",
  edge: "Edge",
  baidu: "Baidu",
  electron: "Electron",
  blackberry_browser: "Blackberry Browser",
  edge_mobile: "Edge Mobile",
  and_uc: "Android UC Browser",
  and_chrome: "Android Chrome",
  and_firefox: "Android Firefox",
  and_webview: "Android Webview",
  and_samsung: "Samsung Browser",
  and_opera: "Opera Android",
  opera: "Opera",
  opera_mini: "Opera Mini",
  opera_mobile: "Opera Mobile",
  node: "Node.js",
  kaios: "KaiOS",
};

export function reverseTargetMappings(targetMappings) {
  const reversedEntries = Object.entries(targetMappings).map((entry) =>
    entry.reverse()
  );
  return Object.fromEntries(reversedEntries);
}

type TargetListItem = {
  target: string;
  parsedVersion: number;
  version: string | "all";
};

/**
 * Determine the targets based on the browserslist config object
 * Get the targets from the eslint config and merge them with targets in browserslist config
 *
 * @param configPath - The file or a directory path to look for the browserslist config file
 */
export default function determineTargetsFromConfig(
  configPath: string,
  config?: BrowserListConfig
): Array<string> {
  const browserslistOpts = { path: configPath };

  // Get targets from eslint settings
  if (Array.isArray(config) || typeof config === "string") {
    return browserslist(config, browserslistOpts);
  }

  if (config && typeof config === "object") {
    return browserslist(
      [...(config.production || []), ...(config.development || [])],
      browserslistOpts
    );
  }

  // Get targets fron browserslist configs
  return browserslist(undefined, browserslistOpts);
}

/**
 * @param targetslist - List of targest from browserslist api
 * @returns  - The lowest version version of each target
 *
 */
export function versioning(targetslist: Array<string>): Array<TargetListItem> {
  return (
    targetslist // Sort the targets by target name and then version number in ascending order
      .map(
        (e: string): TargetListItem => {
          const [target, version] = e.split(" ");
          return {
            target,
            version,
            parsedVersion:
              version === "all"
                ? 0
                : version.includes("-")
                ? parseFloat(version.split("-")[0])
                : parseFloat(version),
          };
        }
      ) // Sort the targets by target name and then version number in descending order
      // ex. [a@3, b@3, a@1] => [a@3, a@1, b@3]
      .sort((a: TargetListItem, b: TargetListItem): number => {
        if (b.target === a.target) {
          // If any version === 'all', return 0. The only version of op_mini is 'all'
          // Otherwise, compare the versions
          return typeof b.parsedVersion === "string" ||
            typeof a.parsedVersion === "string"
            ? 0
            : b.parsedVersion - a.parsedVersion;
        }
        return b.target > a.target ? 1 : -1;
      }) // First last target always has the latest version
      .filter(
        (e: TargetListItem, i: number, items: Array<TargetListItem>): boolean =>
          // Check if the current target is the last of its kind.
          // If it is, then it's the most recent version.
          i + 1 === items.length || e.target !== items[i + 1].target
      )
  );
}
