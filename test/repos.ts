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
  // what version of repo hould be checked out
  targetCommitId: string;
  // related tag for targetCommitId (if it exists)
  targetGitRef?: string;
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
    targetCommitId: "7a6da5e3e7ad7c749dde806546a35d4d4259d965",
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
    targetCommitId: "c240ecabaffb3ddfcb32c7b1970eedb4027caeec",
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
    targetCommitId: "e6ad93ea01bcde1f8ddaa4b4ebe572dd616abfaa",
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
    targetCommitId: "e1cffdef277fcf543833a20d28cbadcd000ebece",
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
    targetCommitId: "1834cd70adf5758541d6167ba8c2c42778443d04",
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
  // {
  //   name: "vscode",
  //   location: path.join(projectRoot, reposDir, "vscode"),
  //   remoteLink: "https://github.com/microsoft/vscode.git",
  //   targetCommitId: "cd9ea6488829f560dc949a8b2fb789f3cdc05f5d",
  //   targetGitRef: "1.46.1",
  //   filePatterns: ["./src/vs", "./extensions", "./build"],
  //   browserslist: ["electron 7.3.1"],
  //   eslintOptions: {
  //     cwd: path.join(projectRoot, reposDir, "vscode"),
  //     extensions: [".js", ".ts"],
  //     useEslintrc: false,
  //     baseConfig: {
  //       extends: ["plugin:compat/recommended"],
  //       env: {
  //         node: true,
  //         es6: true,
  //         browser: true,
  //       },
  //       parser: "@typescript-eslint/parser",
  //       parserOptions: {
  //         ecmaVersion: 6,
  //         sourceType: "module",
  //       },
  //     },
  //   },
  // },
  {
    name: "create-react-app",
    location: path.join(projectRoot, reposDir, "create-react-app"),
    remoteLink: "https://github.com/facebook/create-react-app.git",
    targetCommitId: "d2f813f8897ffcd2f0b0d2da75d0c44924c92f4d",
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
    targetCommitId: "781b6abb47d572c1e52add53166f35e4a876908c",
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
    targetCommitId: "71c6b3b2061af4a4f3a95a265d46e933b8befc2c",
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
  { name, targetGitRef, targetCommitId, remoteLink, location }: RepoInfo,
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
  if (showLogs)
    console.log(`Checking out ${name}@${targetGitRef || targetCommitId}`);
  const commit = await repo.getCommit(targetCommitId);
  await repo.setHeadDetached(commit.id());

  return repo;
}

export default repos;
