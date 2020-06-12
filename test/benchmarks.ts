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

async function getBenchmark(repoInfo: RepoInfo) {
  console.log(`Benchmarking ${repoInfo.remoteLink}`);
  const repo = await getRepo(repoInfo);
  const ref = await repo.getReference(repoInfo.targetGitRef);
  const eslint = new ESLint(repoInfo.eslintOptions);
  console.log(`Checking out ${repoInfo.name} ${repoInfo.targetGitRef}`);
  await repo.checkoutRef(ref);
  console.log(`Running ESLint on ${repoInfo.name}`);

  const benchmark = new Benchmark(
    repoInfo.name,
    (deferred: { resolve: Function }) => {
      eslint
        .lintFiles(repoInfo.location)
        .then(() => deferred.resolve())
        .catch((e) => console.error(e));
    },
    {
      onStart: () => {
        console.log(`Starting benchmark ${repoInfo.name}`);
      },
      onComplete: () => {
        console.log(`Completed benchmark ${repoInfo.name}`);
      },
      onCycle: () => {
        console.log("In between cycle");
      },
      onError: () => {
        console.error("wrong");
        console.error(benchmark.error);
      },
      async: true,
      defer: true,
    }
  );
  return benchmark;
}

(async function main() {
  const benchmarks = repos.map((repo) => {
    return getBenchmark(repo);
  });

  const resolvedBenchmarks = await Promise.all(benchmarks);
  const res = Benchmark.invoke(resolvedBenchmarks, {
    name: "run",
    queued: true,
    onStart: () => console.log(`Starting benchmark suite`),
    onCycle: () => console.log(`Benchmarking ${res[0]}`),

    onComplete: () => {
      console.log("Finished benchmark suite");
      console.log(res);
    },
  });
})().catch((e) => {
  console.error(e);
});
