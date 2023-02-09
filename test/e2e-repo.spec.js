"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const eslint_1 = require("eslint");
const repos_1 = __importStar(require("./repos"));
describe("e2e Repo Tests", () => {
    jest.setTimeout(10 ** 8);
    beforeAll(() => {
        return Promise.all(repos_1.default.map((repo) => (0, repos_1.initRepo)(repo, false)));
    });
    it("should not have a fatal parsing error", async () => {
        repos_1.default.forEach(async ({ eslintOptions, filePatterns }) => {
            const eslint = new eslint_1.ESLint(eslintOptions);
            const results = await eslint.lintFiles(filePatterns);
            const fatalParsingResults = results
                .filter((result) => result.messages.some((message) => message.fatal))
                .map((result) => ({
                filePath: result.filePath,
                messages: result.messages,
            }));
            expect(fatalParsingResults).toHaveLength(0);
        });
    });
    it("should match lint result snapshots", async () => {
        const lintedRepos = await Promise.all(repos_1.default.map(async ({ eslintOptions, filePatterns, name }) => {
            const eslint = new eslint_1.ESLint(eslintOptions);
            const results = await eslint.lintFiles(filePatterns);
            return results
                .filter((result) => result.messages.length > 0)
                .map(({ errorCount, messages }) => ({
                errorCount,
                messages,
                name,
            }));
        }));
        expect(lintedRepos).toMatchSnapshot();
    });
});
