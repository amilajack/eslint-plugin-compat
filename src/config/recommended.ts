/**
 * @file Recommended configs for this plugin
 */

import globals from "globals";
import type { ESLint, Linter } from "eslint";

// Flat config: https://eslint.org/docs/latest/use/configure/configuration-files-new
const flat = {
  languageOptions: {
    globals: {
      ...globals.browser,
    },
  },
  rules: {
    "compat/compat": "error",
  },
} satisfies Linter.FlatConfig;

// eslintrc config: https://eslint.org/docs/latest/use/configure/configuration-files
const legacy = {
  env: {
    browser: true,
  },
  rules: flat.rules,
} satisfies ESLint.ConfigData;

const recommended = {
  flat,
  legacy,
};

export default recommended;
