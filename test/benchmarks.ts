/* eslint no-console: "off" */
import { constants as fsConstants, promises as fs } from "fs";
import path from "path";
import { cwd } from "process";
import Git from "nodegit";
import { ESLint } from "eslint";
import Benchmark from "benchmark";

// Explicitly exit with non-zero when there is some error
// @TODO better error handling
process.on("unhandledRejection", (err) => {
  if (err instanceof Error) throw err;
  throw new Error("Unhandled promise rejection with no message");
});

type RepoInfo = {
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

const projectRoot = cwd();

const repos: Array<RepoInfo> = [
  {
    name: "bootstrap",
    location: path.join(projectRoot, "benchmarks-tmp", "bootstrap"),
    remoteLink: "https://github.com/twbs/bootstrap.git",
    targetGitRef: "v4.5.0",
    filePatterns: [path.join("js", "src"), path.join("js", "tests"), "build"],
    eslintOptions: {
      cwd: path.join(projectRoot, "benchmarks-tmp", "bootstrap"),
      useEslintrc: false,
      baseConfig: {
        extends: ["plugin:compat/recommended"],
        parser: "babel-eslint",
      },
    },
  },
  {
    name: "electron-react-boilerplate",
    location: path.join(
      projectRoot,
      "benchmarks-tmp",
      "electron-react-boilerplate"
    ),
    remoteLink:
      "https://github.com/electron-react-boilerplate/electron-react-boilerplate.git",
    targetGitRef: "v1.1.0",
    filePatterns: ["."],
    browserslist: ["electron 7.1.13"],
    eslintOptions: {
      cwd: path.join(
        projectRoot,
        "benchmarks-tmp",
        "electron-react-boilerplate"
      ),
      extensions: [".js", ".jsx", ".ts", ".tsx"],
      useEslintrc: false,
      baseConfig: {
        extends: ["plugin:compat/recommended"],
        // @TODO INTRO THIS FIX IN ANOTHER PR
        env: {
          browser: true,
          node: true,
        },
        parser: "@typescript-eslint/parser",
        plugins: ["@typescript-eslint"],
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
    location: path.join(projectRoot, "benchmarks-tmp", "handlebars.js"),
    remoteLink: "https://github.com/handlebars-lang/handlebars.js.git",
    targetGitRef: "v4.7.6",
    filePatterns: ["."],
    eslintOptions: {
      cwd: path.join(projectRoot, "benchmarks-tmp", "handlebars.js"),
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
    location: path.join(projectRoot, "benchmarks-tmp", "jquery"),
    remoteLink: "https://github.com/jquery/jquery.git",
    targetGitRef: "3.5.1",
    filePatterns: ["src/**/*.js", "test/**/*.js"],
    eslintOptions: {
      cwd: path.join(projectRoot, "benchmarks-tmp", "jquery"),
      extensions: [".js"],
      useEslintrc: false,
      baseConfig: {
        extends: ["plugin:compat/recommended"],
        env: {},
        globals: {
          window: true,
        },
        parserOptions: {
          ecmaVersion: 2015,
          sourceType: "module",
        },
      },
    },
  },
  {
    name: "preact",
    location: path.join(projectRoot, "benchmarks-tmp", "preact"),
    remoteLink: "https://github.com/preactjs/preact.git",
    targetGitRef: "10.4.4",
    filePatterns: ["*.js"],
    eslintOptions: {
      cwd: path.join(projectRoot, "benchmarks-tmp", "preact"),
      extensions: [".js"],
      useEslintrc: false,
      baseConfig: {
        extends: ["plugin:compat/recommended"],
        env: {
          browser: true,
        },
        parserOptions: {
          ecmaVersion: 7,
          sourceType: "module",
        },
        ignorePatterns: ["test/fixtures", "test/ts/", "*.ts", "dist"],
      },
    },
  },
  {
    name: "vscode",
    location: path.join(projectRoot, "benchmarks-tmp", "vscode"),
    remoteLink: "https://github.com/microsoft/vscode.git",
    targetGitRef: "1.46.0",
    filePatterns: ["./src/vs", "./extensions", "./build"],
    browserslist: ["electron 7.3.1"],
    eslintOptions: {
      cwd: path.join(projectRoot, "benchmarks-tmp", "vscode"),
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
    location: path.join(projectRoot, "benchmarks-tmp", "create-react-app"),
    remoteLink: "https://github.com/facebook/create-react-app.git",
    targetGitRef: "create-react-app@3.4.1",
    filePatterns: ["."],
    eslintOptions: {
      cwd: path.join(projectRoot, "benchmarks-tmp", "create-react-app"),
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
    location: path.join(projectRoot, "benchmarks-tmp", "aframe"),
    remoteLink: "https://github.com/aframevr/aframe.git",
    targetGitRef: "v1.0.4",
    filePatterns: ["."],
    eslintOptions: {
      cwd: path.join(projectRoot, "benchmarks-tmp", "aframe"),
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
    location: path.join(projectRoot, "benchmarks-tmp", "pixi.js"),
    remoteLink: "https://github.com/pixijs/pixi.js.git",
    targetGitRef: "v5.2.4",
    filePatterns: ["test", "bundles", "packages", "tools"],
    eslintOptions: {
      cwd: path.join(projectRoot, "benchmarks-tmp", "pixi.js"),
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
  // {
  //   name: "dev.to",
  //   location: path.join(projectRoot, "benchmarks-tmp", "dev.to"),
  //   remoteLink: "https://github.com/thepracticaldev/dev.to.git",
  //   targetGitRef: "9301a127268cd075bc9cfe618c9180cf0353fb44",
  //   filePatterns: ["*.js", "*.jsx"],
  //   eslintOptions: {
  //     cwd: path.join(projectRoot, "benchmarks-tmp", "dev.to"),
  //     extensions: [".js,.jsx"],
  //     useEslintrc: false,
  //     baseConfig: {
  //       extends: ["plugin:compat/recommended"],
  //       env: {
  //         browser: true,
  //         es6: true,
  //       },
  //       globals: {
  //         Atomics: "readonly",
  //         SharedArrayBuffer: "readonly",
  //       },
  //       parserOptions: {
  //         ecmaVersion: 2018,
  //         sourceType: "module",
  //       },
  //     },
  //   },
  // },
];

async function getRepo({ remoteLink, location }: RepoInfo) {
  // Clone if necessary, else use existing repo
  return fs
    .access(path.join(location, ".git"), fsConstants.R_OK)
    .then(() => {
      console.log(`Using existing ${location}`);
      return Git.Repository.open(location);
    })
    .catch(() => {
      console.log(`Cloning ${remoteLink}`);
      return Git.Clone.clone(remoteLink, location);
    });
}

async function editBrowserslistrc(filePath: string, val: Array<string>) {
  const file = await fs.readFile(filePath);
  const json = JSON.parse(file.toString());
  json.browserslist = val;
  await fs.writeFile(filePath, JSON.stringify(json));
}

async function getBenchmark(repoInfo: RepoInfo) {
  const { name, remoteLink, targetGitRef, eslintOptions, location } = repoInfo;
  console.log(`Retrieving ${remoteLink}`);
  const repo = await getRepo(repoInfo);
  const ref = await repo.getReference(targetGitRef);
  console.log(`Checking out ${name} ${targetGitRef}`);
  const targetRef = await ref.peel(Git.Object.TYPE.COMMIT);
  const commit = await repo.getCommit(targetRef.id());
  await repo.setHeadDetached(commit.id());

  // const kek = await repo
  //   .getHeadCommit()
  //   .then(function (targetCommit) {
  //     return repo.createBranch(targetGitRef, targetCommit, false);
  //   })
  //   .then(function (reference) {
  //     return repo.checkoutBranch(reference, {});
  //   })
  //   .then(function () {
  //     return repo.getReferenceCommit(targetGitRef);
  //   })
  //   .then(function (commit) {
  //     return Git.Reset.reset(repo, commit, 3, {});
  //   });

  const eslint = new ESLint(eslintOptions);
  // console.log(await eslint.calculateConfigForFile("app/components/css.d.ts"));
  if (repoInfo.browserslist) {
    const packageJsonPath = path.join(location, "package.json");
    console.log(`Editing browserslistrc in ${packageJsonPath}`);
    await editBrowserslistrc(packageJsonPath, repoInfo.browserslist);
  }
  console.log(`Checking if  ${name} ${targetGitRef} has fatal linting error`);
  eslint
    .lintFiles(repoInfo.filePatterns)
    .then((lintResults) => {
      const errors: Array<string> = [];
      lintResults.forEach((lintResult) => {
        console.log(`Results for linting: ${lintResult.filePath}`);
        lintResult.messages.forEach((lintMessage) => {
          if (lintMessage.fatal) {
            const errorMessage = `
              Fatal ESLint parsing error
              ${JSON.stringify(lintResult, null, 2)}
            `;
            throw new Error(errorMessage);
          }
          const errorSummary = `
          message: ${lintMessage.message},
          suggestions: ${lintMessage.suggestions},
          `;
          console.log(errorSummary);
          errors.push(errorSummary);
        });
        if (lintResult.errorCount > 0) console.log();
      });
      const errs = lintResults.reduce((sum, e) => e.errorCount + sum, 0);
      let message = `Files linted: ${lintResults.length}`;
      message += `\nErrors (errs) found: ${errors.length}`;
      console.log(message);
      return errors;
    })
    .catch((e) => {
      throw e;
    });

  // console.log(await eslint.calculateConfigForFile("app/components/css.d.ts"));
  const benchmark = new Benchmark(
    name,
    (deferred: { resolve: Function }) => {
      eslint
        .lintFiles(repoInfo.filePatterns)
        // @TODO: PASS FILE PATTERNS
        // @TODO: HARD FAIL ON FATAL PARSING ERROR
        // @TODO: PRINT ERROR ON FATAL
        // @TODO: CHECK FOR FATAL IN DIFFERENT FUNCTION
        // @TODO: BETTER WAY TO COUPLE DIRECTORIES WITH ESLINT CONFIG
        // .lintFiles(location) // .lintFiles(repoInfo.filePatterns)
        .then(() => {
          return deferred.resolve();
        })
        .catch((e) => {
          throw e;
        });
    },
    {
      onStart: () => {
        console.log(`Starting ${name} ${targetGitRef} ESLint benchmark`);
      },
      onComplete: () => {
        console.log(`Completed benchmark ${name}`);
      },
      onError: () => {
        throw new Error("Error with benchmark.js suite");
      },
      async: true,
      defer: true,
      maxTime: 10,
    }
  );
  return benchmark;
}

(async function main() {
  const benchmarks = await Promise.all(repos.slice(1, 2).map(getBenchmark));
  Benchmark.invoke(benchmarks, {
    name: "run",
    async: true,
    onStart: () =>
      console.log(`Starting benchmark suite: ${repos.map((e) => e.name)}`),
    onComplete: (e) => {
      console.log("Finished benchmark suite");
      const reports = e.currentTarget.map((benchmark) => ({
        name: benchmark.name,
        stats: benchmark.stats,
        sample: benchmark.stats.sample,
        sampleCount: benchmark.stats.sample.length,
      }));
      console.log(reports);
    },
  });
})();

/*
BETTER BENCHMARKS
Use Eslint official benchmarks, see how much time is spent on just our benchmarks
- github actions for benhcmarking
- separate out eslint test to use with e2e-repos
*/
