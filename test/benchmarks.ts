/* eslint no-console: off */
import { promises as fs } from "fs";
import path from "path";
import { ESLint } from "eslint";
import Benchmark from "benchmark";
import repos, { RepoInfo, initRepo } from "./repos";

// Explicitly exit with non-zero when there is some error
process.on("unhandledRejection", (err) => {
  if (err instanceof Error) throw err;
  throw new Error("Unhandled promise rejection with no message");
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
  await initRepo(repoInfo);

  const eslint = new ESLint(eslintOptions);
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
      // const errs = lintResults.reduce((sum, e) => e.errorCount + sum, 0);
      let message = `Files linted: ${lintResults.length}`;
      message += `\nErrors (errs) found: ${errors.length}`;
      console.log(message);
      return errors;
    })
    .catch((e) => {
      throw e;
    });

  const benchmark = new Benchmark(
    name,
    (deferred: { resolve: Function }) => {
      eslint
        .lintFiles(repoInfo.filePatterns)
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
        console.error(benchmark.error);
      },
      async: true,
      defer: true,
      maxTime: 10,
    }
  );
  return benchmark;
}

(async () => {
  const benchmarks = await Promise.all(repos.map(getBenchmark));
  Benchmark.invoke(benchmarks, {
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
