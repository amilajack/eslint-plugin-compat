/* eslint no-console: "off" */
import { constants as fsConstants, promises as fs } from "fs";
import { cwd } from "process";
import { Repository, Clone } from "nodegit";
import { ESLint } from "eslint";
import Benchmark from "benchmark";

type RepoInfo = {
  name: string;
  location: string;
  remoteLink: string;
  targetGitRef: string;
  filePatterns: Array<string>;
  browserslist?: Array<string>;
  eslintOptions: ESLint.Options;
};

const projectRoot = cwd();

const repos: Array<RepoInfo> = [
  {
    name: "bootstrap",
    location: `${projectRoot}/benchmarks-tmp/bootstrap`,
    remoteLink: "https://github.com/twbs/bootstrap.git",
    targetGitRef: "v4.5.0",
    filePatterns: ["js/src", "js/tests", "build/"],
    eslintOptions: {
      cwd: `${projectRoot}/benchmarks-tmp/bootstrap`,
      useEslintrc: false,
      baseConfig: {
        extends: ["plugin:compat/recommended"],
        parser: "babel-eslint",
      },
    },
  },
  {
    name: "electron-react-boilerplate",
    location: `${projectRoot}/benchmarks-tmp/electron-react-boilerplate`,
    remoteLink:
      "https://github.com/electron-react-boilerplate/electron-react-boilerplate.git",
    targetGitRef: "v1.1.0",
    filePatterns: ["."],
    browserslist: ["electron 7.1.13"],
    eslintOptions: {
      cwd: `${projectRoot}/benchmarks-tmp/electron-react-boilerplate`,
      extensions: [".js", ".jsx", ".ts", ".tsx"],
      useEslintrc: false,
      baseConfig: {
        extends: ["plugin:compat/recommended"],
      },
    },
  },
];

async function getRepo({ remoteLink, location }: RepoInfo) {
  // Clone if necessary, else use existing repo
  return fs
    .access(`${location}/.git`, fsConstants.R_OK)
    .then(() => {
      console.log(`Using existing ${location}`);
      return Repository.open(location);
    })
    .catch(() => {
      console.log(`Cloning ${remoteLink}`);
      return Clone.clone(remoteLink, location);
    });
}

async function editBrowserslistrc(path: string, val: Array<string>) {
  const file = await fs.readFile(path);
  const json = JSON.parse(file.toString());
  json.browserslist = val;
  await fs.writeFile(path, JSON.stringify(json));
}

async function getBenchmark(repoInfo: RepoInfo) {
  const { name, remoteLink, targetGitRef, eslintOptions, location } = repoInfo;
  console.log(`Retrieving ${remoteLink}`);
  const repo = await getRepo(repoInfo);
  const ref = await repo.getReference(targetGitRef);
  const eslint = new ESLint(eslintOptions);
  console.log(`Checking out ${name} ${targetGitRef}`);
  await repo.checkoutRef(ref);
  if (repoInfo.browserslist) {
    const packageJsonPath = `${location}/package.json`;
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
  const benchmarks = repos.map((repo) => {
    return getBenchmark(repo);
  });

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
})().catch((e) => {
  console.error(e);
});
