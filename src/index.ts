/**
 * Step 1) Entry point of plugin. Exports itself for eslint to use
 * @author Amila Welihinda
 */

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------
import type { Linter } from "eslint";
import pkg from "../package.json";
import recommended from "./config/recommended";

//------------------------------------------------------------------------------
// Plugin Definition
//------------------------------------------------------------------------------

// import all rules in lib/rules
import compat from "./rules/compat";

const rules = {
  compat,
};

const plugin = {
  meta: {
    name: pkg.name,
    version: pkg.version,
  },
  configs: {},
  rules,
};

const configs = {
  "flat/recommended": {
    name: "compat/flat/recommended",
    plugins: { compat: plugin },
    ...recommended.flat,
  } as Linter.FlatConfig,
  recommended: {
    plugins: ["compat"],
    ...recommended.legacy,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any, // Legacy config format - type differs between ESLint 8 and 9
};
plugin.configs = configs;

export = {
  ...(plugin as typeof plugin & { configs: typeof configs }),
  // TODO: Remove this in next major release
  /**
   * @deprecated Use `.configs` instead. This will be removed in the next major release.
   */
  config: configs,
};
