import { ESLint } from "eslint";
import repos, { getRepo } from "./repos";

describe("e2e Repo Tests", () => {
  jest.setTimeout(10 ** 8);

  it("should lint repos", async () => {
    // ESLint is not defined for eslint versions < 7
    // This allows CI tests to pass on older eslint versions
    if (!ESLint) return;
    await Promise.all(repos.map((repo) => getRepo(repo)));

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
