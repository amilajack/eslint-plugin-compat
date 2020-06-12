/* eslint no-console: "off" */
import { Repository, Clone } from "nodegit";
import { constants as fsConstants, promises as fs } from "fs";

type RepoInfo = {
  name: string;
  remoteLink: string;
  targetGitRef: string;
};

const repos: Array<RepoInfo> = [
  {
    name: "bootstrap",
    remoteLink: "https://github.com/twbs/bootstrap.git",
    targetGitRef: "v4.5.0",
  },
  {
    name: "electron-react-boilerplate",
    remoteLink:
      "https://github.com/electron-react-boilerplate/electron-react-boilerplate.git",
    targetGitRef: "v1.1.0",
  },
];

async function getRepo({ name, remoteLink }: RepoInfo) {
  // Clone if necessary, else use existing repo
  const repoPath = `benchmarks-tmp/${name}`;
  return fs
    .access(`benchmarks-tmp/${name}/.git`, fsConstants.R_OK)
    .then(() => {
      console.log(`Using existing ${repoPath}`);
      return Repository.open(repoPath);
    })
    .catch(() => {
      console.log(`Cloning ${remoteLink}`);
      return Clone.clone(remoteLink, repoPath);
    });
}

async function benchmark(repoInfo: RepoInfo) {
  console.log(`Benchmarking ${repoInfo.remoteLink}`);
  const repo = await getRepo(repoInfo);
  const ref = await repo.getReference(repoInfo.targetGitRef);
  repo.checkoutRef(ref);
}

(async function main() {
  repos.forEach((repo) => benchmark(repo));
})().catch((e) => {
  console.error(e);
});
