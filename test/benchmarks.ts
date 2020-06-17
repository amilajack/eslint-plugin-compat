/* eslint no-console: "off" */
import { constants as fsConstants, promises as fs } from "fs";
import path from "path";
import { cwd } from "process";
import Git from "nodegit";
import { ESLint } from "eslint";
import Benchmark from "benchmark";

// Explicitly exit with non-zero when there is some error
process.on("unhandledRejection", (err) => {
  throw new Error(err);
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

  const eslint = new ESLint(eslintOptions);
  if (repoInfo.browserslist) {
    const packageJsonPath = path.join(location, "package.json");
    console.log(`Editing browserslistrc in ${packageJsonPath}`);
    await editBrowserslistrc(packageJsonPath, repoInfo.browserslist);
  }

  const benchmark = new Benchmark(
    name,
    (deferred: { resolve: Function }) => {
      eslint
        .lintFiles(location)
        .then(() => {
          return deferred.resolve();
        })
        .catch((e) => console.error(e));
    },
    {
      onStart: () => {
        console.log(`Starting ${name} ${targetGitRef} ESLint benchmark`);
      },
      onComplete: () => {
        console.log(`Completed benchmark ${name}`);
      },
      onError: () => {
        console.error(benchmark.error);
      },
      async: true,
      defer: true,
      maxTime: 30,
    }
  );
  return benchmark;
}

(async function main() {
  const benchmarks = repos.map(getBenchmark);

  const resolvedBenchmarks = await Promise.all(benchmarks);
  Benchmark.invoke(resolvedBenchmarks, {
    name: "run",
    async: true,
    onStart: () => console.log(`Starting benchmark suite`),
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
