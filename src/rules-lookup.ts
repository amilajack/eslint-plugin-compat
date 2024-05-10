import { AstMetadataApiWithTargetsResolver } from "./types";

// https://stackoverflow.com/q/49752151/25507
type KeysOfType<T, TProp> = keyof T &
  { [P in keyof T]: T[P] extends TProp ? P : never }[keyof T];

export type RulesLookup = Map<
  string | undefined,
  AstMetadataApiWithTargetsResolver
>;

export function lookupKey(...args: Array<string | null | undefined>) {
  return args.map((i) => (i == null ? null : i)).join("\0");
}

export function makeLookup(
  rules: AstMetadataApiWithTargetsResolver[],
  ...keys: Array<
    KeysOfType<Required<AstMetadataApiWithTargetsResolver>, string>
  >
) {
  const lookup = new Map<
    string | undefined,
    AstMetadataApiWithTargetsResolver
  >();
  // Iterate in inverse order to favor earlier rules in case of conflict.
  for (let i = rules.length - 1; i >= 0; i--) {
    const key =
      keys.length === 1
        ? rules[i][keys[0]]
        : lookupKey(...keys.map((k) => rules[i][k]));
    lookup.set(key, rules[i]);
  }
  return lookup;
}
