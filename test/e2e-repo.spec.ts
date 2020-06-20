import { ESLint } from "eslint";
import repos, { getRepo } from "./repos";

describe("e2e Repo Tests", () => {
  it("should lint repos", async () => {
    await Promise.all(repos.map((repo) => getRepo(repo, false)));
    const lintedRepos = await Promise.all(
      repos.map(async ({ eslintOptions, location, name }) => {
        const eslint = new ESLint(eslintOptions);
        const results = await eslint.lintFiles(location);
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
