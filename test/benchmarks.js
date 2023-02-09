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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint no-console: off */
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const eslint_1 = require("eslint");
const benchmark_1 = __importDefault(require("benchmark"));
const repos_1 = __importStar(require("./repos"));
// Explicitly exit with non-zero when there is some error
process.on("unhandledRejection", (err) => {
    if (err instanceof Error)
        throw err;
    throw new Error("Unhandled promise rejection with no message");
});
async function editBrowserslistrc(filePath, targets) {
    const file = await fs_1.promises.readFile(filePath);
    const json = {
        ...JSON.parse(file.toString()),
        browserslist: targets,
    };
    await fs_1.promises.writeFile(filePath, JSON.stringify(json));
}
async function getBenchmark(repoInfo) {
    const { name, targetGitRef, eslintOptions, location } = repoInfo;
    await (0, repos_1.initRepo)(repoInfo);
    const eslint = new eslint_1.ESLint(eslintOptions);
    if (repoInfo.browserslist) {
        const packageJsonPath = path_1.default.join(location, "package.json");
        console.log(`Editing browserslistrc in ${packageJsonPath}`);
        await editBrowserslistrc(packageJsonPath, repoInfo.browserslist);
    }
    const benchmark = new benchmark_1.default(name, (deferred) => {
        eslint
            .lintFiles(repoInfo.filePatterns)
            .then(() => {
            return deferred.resolve();
        })
            .catch((e) => {
            throw e;
        });
    }, {
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
    });
    return benchmark;
}
(async () => {
    const benchmarks = await Promise.all(repos_1.default.map(getBenchmark));
    benchmark_1.default.invoke(benchmarks, {
        name: "run",
        async: true,
        onStart: () => console.log("Starting benchmark suite"),
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
