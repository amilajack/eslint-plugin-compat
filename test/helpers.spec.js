"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const helpers_1 = require("../src/helpers");
const multi_config_package_json_1 = __importDefault(require("./multi-config.package.json"));
const single_array_config_package_json_1 = __importDefault(require("./single-array-config.package.json"));
const single_version_config_package_json_1 = __importDefault(require("./single-version-config.package.json"));
describe("Versioning", () => {
    it("should support multi env config in browserslist package.json", () => {
        const config = (0, helpers_1.determineTargetsFromConfig)(".", multi_config_package_json_1.default.browsers);
        const result = (0, helpers_1.parseBrowsersListVersion)(config);
        expect(result).toMatchSnapshot();
    });
    it("should support resolving browserslist config in subdirectory", () => {
        // This should resolve the ./test/.browserslistrc config
        const relativeConfig = (0, helpers_1.determineTargetsFromConfig)(path_1.default.join(__dirname, ".browserslistrc"));
        const rootConfig = (0, helpers_1.determineTargetsFromConfig)(require.resolve("../package.json"));
        const relativeConfigVersions = (0, helpers_1.parseBrowsersListVersion)(relativeConfig);
        expect(relativeConfigVersions).toMatchSnapshot();
        const rootConfigVersions = (0, helpers_1.parseBrowsersListVersion)(rootConfig);
        expect(rootConfigVersions).toMatchSnapshot();
        expect(relativeConfigVersions).not.toEqual(rootConfigVersions);
    });
    it("should support single array config in browserslist package.json", () => {
        const config = (0, helpers_1.determineTargetsFromConfig)(".", single_array_config_package_json_1.default.browsers);
        const result = (0, helpers_1.parseBrowsersListVersion)(config);
        expect(result).toMatchSnapshot();
    });
    it("should support single version config in browserslist package.json", () => {
        const config = (0, helpers_1.determineTargetsFromConfig)(".", single_version_config_package_json_1.default.browsers);
        const result = (0, helpers_1.parseBrowsersListVersion)(config);
        expect(result).toMatchInlineSnapshot(`
      [
        {
          "parsedVersion": 8,
          "target": "safari",
          "version": "8",
        },
        {
          "parsedVersion": 9,
          "target": "ie",
          "version": "9",
        },
        {
          "parsedVersion": 20,
          "target": "firefox",
          "version": "20",
        },
        {
          "parsedVersion": 32,
          "target": "chrome",
          "version": "32",
        },
      ]
    `);
    });
    it("should get lowest target versions", () => {
        const versions = [
            "chrome 20",
            "chrome 30",
            "node 7",
            "chrome 30.5",
            "firefox 50.5",
        ];
        expect((0, helpers_1.parseBrowsersListVersion)(versions)).toMatchSnapshot();
    });
    it("should support string config in rule option", () => {
        const config = (0, helpers_1.determineTargetsFromConfig)(".", "defaults, not ie < 9");
        const result = (0, helpers_1.parseBrowsersListVersion)(config);
        expect(result).toMatchSnapshot();
    });
    it("should fail on incorrect browserslist target version", () => {
        expect(() => {
            (0, helpers_1.determineTargetsFromConfig)(".", "edge 100000");
        }).toThrow("Unknown version 100000 of edge");
    });
});
