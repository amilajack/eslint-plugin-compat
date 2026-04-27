/**
 * Regressions for case-sensitive API matching and memoization of getRulesForTargets
 * (see PR #679 review: lodash.memoize first-arg only; toLowerCase map keys / lookups).
 */
import { ESLint } from "eslint";
import { parser } from "typescript-eslint";
import * as eslint from "eslint";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import rule from "../src/rules/compat";
import compat from "../src";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const eslintMod = eslint as any;
const eslintVersion = parseInt(
  (eslintMod.Linter?.version || eslintMod.version || "9").split(".")[0],
  10
);

// RuleTester: match e2e.spec.ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config: any =
  eslintVersion >= 9
    ? {
        languageOptions: {
          parser,
          parserOptions: { ecmaVersion: 2020, sourceType: "script" },
        },
        settings: {
          lintAllEsApis: true,
        },
      }
    : {
        parser: require.resolve("@typescript-eslint/parser"),
        parserOptions: { ecmaVersion: 2020, sourceType: "script" },
        settings: {
          lintAllEsApis: true,
        },
      };

const ruleTester = new eslint.RuleTester(config);

ruleTester.run("compat (case-sensitive + memo regressions)", rule, {
  valid: [
    {
      // Lowercase identifier is not the URL constructor; must not match the URL() rule
      // (JS identifiers are case-sensitive).
      code: "void new url();",
      settings: { browsers: ["ie 8"], lintAllEsApis: true },
    },
    {
      // document rules always carry a property; wrong case must not match document.querySelector
      code: "void document.QuerySelector;",
      settings: { browsers: ["ie 8"], lintAllEsApis: true },
    },
  ],
  invalid: [
    {
      code: "void new URL();",
      settings: { browsers: ["ie 8"], lintAllEsApis: true },
      errors: [
        {
          message: "URL is not supported in IE 8",
        },
      ],
    },
    {
      code: "void document.querySelector;",
      settings: { browsers: ["ie 8"], lintAllEsApis: true },
      errors: [
        {
          message: "document.querySelector() is not supported in IE 8",
        },
      ],
    },
  ],
});

describe("getRulesForTargets memo (cache key includes boolean second arg)", () => {
  it("default vs polyfills: es:all does not reuse a stale map from the other setting", async () => {
    const tmpDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "compat-memo-lintAllEs-")
    );
    try {
      const filePath = path.join(tmpDir, "a.js");
      await fs.writeFile(filePath, "Array.from([1, 2, 3]);");

      // lintAllEsApis is derived: false in settings is OR'd with "!babel && !es:all" and usually becomes true.
      // Polyfills: ["es:all"] is the way to get computed lintAllEsApis false without babel in-tree.
      const makeEslint = (settings: { polyfills?: string[] }) =>
        new ESLint({
          overrideConfigFile: true,
          ignore: false,
          cwd: tmpDir,
          baseConfig: [
            compat.configs["flat/recommended"],
            {
              languageOptions: {
                parserOptions: { ecmaVersion: 2022, sourceType: "script" },
              },
              settings: {
                browsers: ["ie 8"],
                ...settings,
              },
            },
          ],
        });

      // Warm cache with ES rules included (Array.from is kind "es" in the rule set)
      const r1 = await makeEslint({}).lintFiles([filePath]);
      expect(r1[0].messages.length).toBeGreaterThan(0);
      expect(r1[0].messages[0].ruleId).toBe("compat/compat");

      // Must not return the memoized map from the run with ES rules: es:all should drop ES APIs
      const r2 = await makeEslint({ polyfills: ["es:all"] }).lintFiles([filePath]);
      expect(r2[0].messages).toHaveLength(0);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
