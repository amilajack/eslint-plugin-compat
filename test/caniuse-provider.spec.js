"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("../src/helpers");
const caniuse_provider_1 = require("../src/providers/caniuse-provider");
const expect_range_result_config_json_1 = __importDefault(require("./expect-range-result-config.json"));
describe("CanIUseProvider", () => {
    it("should return unsupported iOS targets with range value for Fetch API", () => {
        const node = { caniuseId: "fetch" };
        const config = (0, helpers_1.determineTargetsFromConfig)(".", expect_range_result_config_json_1.default.browsers);
        const targets = (0, helpers_1.parseBrowsersListVersion)(config);
        const result = (0, caniuse_provider_1.getUnsupportedTargets)(node, targets);
        expect(result).toMatchSnapshot();
    });
});
