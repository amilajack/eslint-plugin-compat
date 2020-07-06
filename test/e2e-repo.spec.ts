import { ESLint } from "eslint";
import repos, { initRepo } from "./repos";

describe("e2e Repo Tests", () => {
  jest.setTimeout(10 ** 8);

  it("should lint repos", async () => {
    await Promise.all(repos.map((repo) => initRepo(repo, false)));

  it("should match lint result snapshots", async () => {
    const lintedRepos = await Promise.all(
      repos.map(async ({ eslintOptions, filePatterns, name }) => {
        const eslint = new ESLint(eslintOptions);
        const results = await eslint.lintFiles(filePatterns);
        return results
          .filter((result) => result.messages.length > 0)
          .map(({ errorCount, messages }) => ({
            errorCount,
            messages,
            name,
          }));
      })
    );
    expect(lintedRepos).toMatchSnapshot();
  });
});
