/**
 * Tests for isUsingTranspiler behavior: babel config detection, memoization by directory,
 * and backwards compatibility with file path (not directory) input.
 */
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { ESLint } from "eslint";
import compat from "../src";

describe("isUsingTranspiler (babel config detection)", () => {
  const eslintBaseConfig = {
    overrideConfigFile: true,
    ignore: false,
    baseConfig: [
      compat.configs["flat/recommended"],
      {
        languageOptions: {
          parserOptions: { ecmaVersion: 2022, sourceType: "module" },
        },
        settings: {
          browsers: ["ie 10"],
        },
      },
    ],
  };

  const codeWithEsApi = "Array.from([1, 2, 3]);";

  it("does not report ES APIs when babel config exists in directory (polyfilled)", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "compat-babel-"));
    try {
      await fs.writeFile(
        path.join(tmpDir, "babel.config.json"),
        JSON.stringify({ presets: ["@babel/env"] })
      );
      const filePath = path.join(tmpDir, "src", "index.js");
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      // @ts-expect-error Bug? ESLint flat config types
      const eslint = new ESLint({
        ...eslintBaseConfig,
        cwd: tmpDir,
      });
      const results = await eslint.lintText(codeWithEsApi, {
        filePath,
      });

      expect(results[0].messages).toHaveLength(0);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("reports ES APIs when lintAllEsApis is true (backwards compatible behavior)", async () => {
    const tmpDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "compat-lintAllEsApis-")
    );
    try {
      const filePath = path.join(tmpDir, "index.js");
      await fs.writeFile(filePath, codeWithEsApi);

      const eslint = new ESLint({
        ...eslintBaseConfig,
        baseConfig: [
          compat.configs["flat/recommended"],
          {
            languageOptions: {
              parserOptions: { ecmaVersion: 2022, sourceType: "module" },
            },
            settings: {
              browsers: ["ie 8"],
              lintAllEsApis: true,
            },
          },
        ],
        overrideConfigFile: true,
        ignore: false,
        cwd: tmpDir,
      });
      const results = await eslint.lintFiles([filePath]);

      expect(results[0].messages.length).toBeGreaterThan(0);
      expect(results[0].messages[0].ruleId).toBe("compat/compat");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("accepts file path (not directory) and correctly infers directory via path.dirname", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "compat-filepath-"));
    try {
      await fs.writeFile(
        path.join(tmpDir, "babel.config.json"),
        JSON.stringify({ presets: ["@babel/env"] })
      );
      const filePath = path.join(tmpDir, "deep", "nested", "file.js");
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      // @ts-expect-error Bug? ESLint flat config types
      const eslint = new ESLint({
        ...eslintBaseConfig,
        cwd: tmpDir,
      });
      const results = await eslint.lintText(codeWithEsApi, {
        filePath,
      });

      expect(results[0].messages).toHaveLength(0);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("memoizes by directory: multiple files in same directory share cached result", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "compat-memo-"));
    try {
      await fs.writeFile(
        path.join(tmpDir, "babel.config.json"),
        JSON.stringify({ presets: ["@babel/env"] })
      );
      const file1 = path.join(tmpDir, "src", "a.js");
      const file2 = path.join(tmpDir, "src", "b.js");
      await fs.mkdir(path.dirname(file1), { recursive: true });

      // @ts-expect-error Bug? ESLint flat config types
      const eslint = new ESLint({
        ...eslintBaseConfig,
        cwd: tmpDir,
      });
      const [results1, results2] = await Promise.all([
        eslint.lintText(codeWithEsApi, { filePath: file1 }),
        eslint.lintText(codeWithEsApi, { filePath: file2 }),
      ]);

      expect(results1[0].messages).toHaveLength(0);
      expect(results2[0].messages).toHaveLength(0);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("detects babel via package.json babel property when no babel config file", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "compat-pkgbabel-"));
    try {
      await fs.writeFile(
        path.join(tmpDir, "package.json"),
        JSON.stringify({
          name: "test",
          version: "1.0.0",
          babel: { presets: ["@babel/env"] },
        })
      );
      const filePath = path.join(tmpDir, "index.js");

      // @ts-expect-error Bug? ESLint flat config types
      const eslint = new ESLint({
        ...eslintBaseConfig,
        cwd: tmpDir,
      });
      const results = await eslint.lintText(codeWithEsApi, {
        filePath,
      });

      expect(results[0].messages).toHaveLength(0);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
