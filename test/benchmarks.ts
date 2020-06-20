/* eslint no-console: off */
import { promises as fs } from "fs";
import path from "path";
import { ESLint } from "eslint";
import Benchmark from "benchmark";
import repos, { RepoInfo, getRepo } from "./repos";

// Explicitly exit with non-zero when there is some error
process.on("unhandledRejection", (err) => {
  throw new Error(err as string);
});

async function editBrowserslistrc(filePath: string, targets: Array<string>) {
  const file = await fs.readFile(filePath);
  const json = {
    ...JSON.parse(file.toString()),
    browserslist: targets,
  };
  await fs.writeFile(filePath, JSON.stringify(json));
}

async function getBenchmark(repoInfo: RepoInfo) {
  const { name, targetGitRef, eslintOptions, location } = repoInfo;
  await getRepo(repoInfo);

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
        .catch(console.error);
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
      maxTime: 10,
    }
  );
  return benchmark;
}

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
