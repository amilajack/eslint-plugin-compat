/**
 * Step 1) Entry point of plugin. Exports itself for eslint to use
 * @author Amila Welihinda
 */

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------
import recommended from "./config/recommended";
import pkg from "../package.json";
import type { Linter } from "eslint";

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
    plugins: { compat: plugin },
    ...recommended.flat,
  } as Linter.FlatConfig,
  recommended: {
    plugins: ["compat"],
    ...recommended.legacy,
  } as Linter.Config,
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
