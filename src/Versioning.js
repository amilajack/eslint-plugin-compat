// @flow
import browserslist from 'browserslist';
import type { BrowserListConfig } from './rules/compat';

type TargetListItem = {
  target: string,
  parsedVersion: number,
  version: string | 'all'
};

/**
 * Determine the targets based on the browserslist config object
 *
 * @param configPath - The file or a directory path to look for the browserslist config file
 */
export default function DetermineTargetsFromConfig(
  configPath: string,
  config?: BrowserListConfig
): Array<string> {
  const browserslistOpts = { path: configPath };

  if (Array.isArray(config) || typeof config === 'string') {
    return browserslist(config, browserslistOpts);
  }

  if (config && typeof config === 'object') {
    return browserslist(
      [...(config.production || []), ...(config.development || [])],
      browserslistOpts
    );
  }

  return browserslist(undefined, browserslistOpts);
}

/**
 * Take a list of targets returned from browserslist api, return the lowest version
 * version of each target
 */
export function Versioning(targetslist: Array<string>): Array<TargetListItem> {
  return (
    targetslist
      // Sort the targets by target name and then version number in ascending order
      .map(
        (e: string): TargetListItem => {
          const [target, version] = e.split(' ');
          return {
            target,
            version,
            parsedVersion:
              version === 'all'
                ? 0
                : version.includes('-')
                ? parseFloat(version.split('-')[0])
                : parseFloat(version)
          };
        }
      )
      // Sort the targets by target name and then version number in descending order
      // ex. [a@3, b@3, a@1] => [a@3, a@1, b@3]
      .sort(
        (a: TargetListItem, b: TargetListItem): number => {
          if (b.target === a.target) {
            // If any version === 'all', return 0. The only version of op_mini is 'all'
            // Otherwise, compare the versions
            return typeof b.parsedVersion === 'string' ||
              typeof a.parsedVersion === 'string'
              ? 0
              : b.parsedVersion - a.parsedVersion;
          }
          return b.target > a.target ? 1 : -1;
        }
      )
      // First last target always has the latest version
      .filter(
        (e: TargetListItem, i: number, items: Array<TargetListItem>): boolean =>
          // Check if the current target is the last of its kind. If it is, then it
          // is most recent version
          i + 1 === items.length || e.target !== items[i + 1].target
      )
  );
}
