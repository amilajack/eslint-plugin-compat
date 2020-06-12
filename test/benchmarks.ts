/* eslint no-console: "off" */
import { constants as fsConstants, promises as fs } from "fs";
import { cwd } from "process";
import { Repository, Clone } from "nodegit";
import { ESLint } from "eslint";

type RepoInfo = {
  name: string;
  location: string;
  remoteLink: string;
  targetGitRef: string;
  filePatterns: Array<string>;
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

async function benchmark(repoInfo: RepoInfo) {
  console.log(`Benchmarking ${repoInfo.remoteLink}`);
  const repo = await getRepo(repoInfo);
  const ref = await repo.getReference(repoInfo.targetGitRef);
  const eslint = new ESLint(repoInfo.eslintOptions);
  console.log(`Checking out ${repoInfo.name} ${repoInfo.targetGitRef}`);
  await repo.checkoutRef(ref);
  console.log(`Running ESLint on ${repoInfo.name}`);
  const lintResults = await eslint.lintFiles(repoInfo.location);
  lintResults.forEach((res) => {
    console.log(res);
  });
}

(async function main() {
  repos.forEach((repo) => benchmark(repo));
})().catch((e) => {
  console.error(e);
});
