/* eslint no-console: off */
import path from "path";
import { mkdirSync, existsSync } from "fs";
import Git from "nodegit";
import { ESLint } from "eslint";

export type RepoInfo = {
  // name of repo
  name: string;
  // location to store repo within project
  location: string;
  // where to clone repo from
  remoteLink: string;
  // what target should
  targetGitRef: string;
  // file patterns to lint in repo
  filePatterns: Array<string>;
  // browsers the repo should target (if omitted then uses default browserlist)
  browserslist?: Array<string>;
  // used in new ESLint(options)
  eslintOptions: ESLint.Options;
};

const projectRoot = path.join(__dirname, "..");

const reposDir = "benchmarks-tmp";

const repos: Array<RepoInfo> = [
  {
    name: "bootstrap",
    location: path.join(projectRoot, reposDir, "bootstrap"),
    remoteLink: "https://github.com/twbs/bootstrap.git",
    targetGitRef: "v4.5.0",
    filePatterns: [path.join("js", "src"), path.join("js", "tests"), "build"],
    eslintOptions: {
      cwd: path.join(projectRoot, reposDir, "bootstrap"),
      useEslintrc: false,
      baseConfig: {
        extends: ["plugin:compat/recommended"],
        parser: "babel-eslint",
      },
    },
  },
  {
    name: "electron-react-boilerplate",
    location: path.join(projectRoot, reposDir, "electron-react-boilerplate"),
    remoteLink:
      "https://github.com/electron-react-boilerplate/electron-react-boilerplate.git",
    targetGitRef: "v1.1.0",
    filePatterns: ["."],
    browserslist: ["electron 7.1.13"],
    eslintOptions: {
      cwd: path.join(projectRoot, reposDir, "electron-react-boilerplate"),
      extensions: [".js", ".jsx", ".ts", ".tsx"],
      useEslintrc: false,
      baseConfig: {
        extends: ["plugin:compat/recommended"],
        parser: "@typescript-eslint/parser",
        plugins: ["@typescript-eslint"],
        env: {
          browser: true,
          node: true,
        },
        parserOptions: {
          ecmaVersion: 2020,
          sourceType: "module",
        },
        ignorePatterns: ["*css.d.ts", "*sass.d.ts", "*scss.d.ts"],
      },
    },
  },
  {
    name: "handlebars.js",
    location: path.join(projectRoot, reposDir, "handlebars.js"),
    remoteLink: "https://github.com/handlebars-lang/handlebars.js.git",
    targetGitRef: "v4.7.6",
    filePatterns: ["."],
    eslintOptions: {
      cwd: path.join(projectRoot, reposDir, "handlebars.js"),
      extensions: [".js"],
      useEslintrc: false,
      baseConfig: {
        extends: ["plugin:compat/recommended"],
        parserOptions: {
          ecmaVersion: 2018,
          sourceType: "module",
        },
      },
    },
  },
  {
    name: "jquery",
    location: path.join(projectRoot, reposDir, "jquery"),
    remoteLink: "https://github.com/jquery/jquery.git",
    targetGitRef: "3.5.1",
    filePatterns: ["src/**/*.js", "test/**/*.js"],
    eslintOptions: {
      cwd: path.join(projectRoot, reposDir, "jquery"),
      extensions: [".js"],
      useEslintrc: false,
      baseConfig: {
        extends: ["plugin:compat/recommended"],
        env: {},
        globals: {
          window: true,
        },
        parserOptions: {
          ecmaVersion: 2018,
          sourceType: "module",
        },
      },
    },
  },
  {
    name: "preact",
    location: path.join(projectRoot, reposDir, "preact"),
    remoteLink: "https://github.com/preactjs/preact.git",
    targetGitRef: "10.4.4",
    filePatterns: ["*.js"],
    eslintOptions: {
      cwd: path.join(projectRoot, reposDir, "preact"),
      extensions: [".js"],
      useEslintrc: false,
      baseConfig: {
        parser: "@typescript-eslint/parser",
        extends: ["plugin:compat/recommended"],
        env: {
          browser: true,
        },
        parserOptions: {
          ecmaVersion: 7,
          sourceType: "module",
          jsx: true,
        },
        ignorePatterns: ["test/fixtures", "test/ts/", "*.ts", "dist"],
      },
    },
  },
  {
    name: "vscode",
    location: path.join(projectRoot, reposDir, "vscode"),
    remoteLink: "https://github.com/microsoft/vscode.git",
    targetGitRef: "1.46.0",
    filePatterns: ["./src/vs", "./extensions", "./build"],
    browserslist: ["electron 7.3.1"],
    eslintOptions: {
      cwd: path.join(projectRoot, reposDir, "vscode"),
      extensions: [".js", ".ts"],
      useEslintrc: false,
      baseConfig: {
        extends: ["plugin:compat/recommended"],
        env: {
          node: true,
          es6: true,
          browser: true,
        },
        parser: "@typescript-eslint/parser",
        parserOptions: {
          ecmaVersion: 6,
          sourceType: "module",
        },
      },
    },
  },
  {
    name: "create-react-app",
    location: path.join(projectRoot, reposDir, "create-react-app"),
    remoteLink: "https://github.com/facebook/create-react-app.git",
    targetGitRef: "create-react-app@3.4.1",
    filePatterns: ["."],
    eslintOptions: {
      cwd: path.join(projectRoot, reposDir, "create-react-app"),
      extensions: [".js"],
      useEslintrc: false,
      baseConfig: {
        root: true,
        parser: "babel-eslint",
        extends: ["plugin:compat/recommended"],
        env: {
          browser: true,
          commonjs: true,
          node: true,
          es6: true,
        },
        parserOptions: {
          ecmaVersion: 2018,
          sourceType: "module",
          ecmaFeatures: {
            jsx: true,
          },
        },
        overrides: [
          {
            files: ["**/*.ts?(x)"],
            parser: "@typescript-eslint/parser",
            parserOptions: {
              ecmaVersion: 2018,
              sourceType: "module",
              ecmaFeatures: {
                jsx: true,
              },
              warnOnUnsupportedTypeScriptVersion: true,
            },
            plugins: ["@typescript-eslint"],
          },
        ],
      },
    },
  },
  {
    name: "aframe",
    location: path.join(projectRoot, reposDir, "aframe"),
    remoteLink: "https://github.com/aframevr/aframe.git",
    targetGitRef: "v1.0.4",
    filePatterns: ["."],
    eslintOptions: {
      cwd: path.join(projectRoot, reposDir, "aframe"),
      extensions: [".js"],
      useEslintrc: false,
      baseConfig: {
        extends: ["plugin:compat/recommended"],
        env: {
          es6: true,
        },
        ignorePatterns: [
          "build/**",
          "dist/**",
          "examples/**/shaders/*.js",
          "**/vendor/**",
        ],
      },
    },
  },
  {
    name: "pixi.js",
    location: path.join(projectRoot, reposDir, "pixi.js"),
    remoteLink: "https://github.com/pixijs/pixi.js.git",
    targetGitRef: "v5.2.4",
    filePatterns: ["test", "bundles", "packages", "tools"],
    eslintOptions: {
      cwd: path.join(projectRoot, reposDir, "pixi.js"),
      extensions: [".js", ".ts"],
      useEslintrc: false,
      baseConfig: {
        root: true,
        extends: ["plugin:compat/recommended"],
        env: {
          es6: true,
          browser: true,
        },
        parser: "@typescript-eslint/parser",
        plugins: ["@typescript-eslint"],
        parserOptions: {
          ecmaVersion: 8,
          sourceType: "module",
        },
      },
    },
  },
];

export async function initRepo(
  { name, targetGitRef, remoteLink, location }: RepoInfo,
  showLogs = true
) {
  const benchmarksAbsPath = path.join(projectRoot, reposDir);
  if (!existsSync(benchmarksAbsPath)) {
    mkdirSync(benchmarksAbsPath);
  }

  if (showLogs) console.log(`Retrieving ${remoteLink}`);
  // Clone if necessary, else use existing repo
  if (existsSync(path.join(location, ".git"))) {
    if (showLogs) console.log(`Using existing ${location}`);
    return Git.Repository.open(location);
  }
  await Git.Clone.clone(remoteLink, location);
  const repo = await Git.Repository.open(location);
  const ref = await repo.getReference(targetGitRef);
  if (showLogs) console.log(`Checking out ${name} ${targetGitRef}`);
  const targetRef = await ref.peel(Git.Object.TYPE.COMMIT);
  const commit = await repo.getCommit(targetRef.id());
  await repo.setHeadDetached(commit.id());

  return repo;
}

export default repos;
