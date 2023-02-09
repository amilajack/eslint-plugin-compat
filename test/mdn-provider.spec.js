"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("../src/helpers");
const mdn_provider_1 = require("../src/providers/mdn-provider");
describe("MdnProvider", () => {
    it("should support Safari TP", () => {
        const node = { protoChainId: "AbortController" };
        const config = (0, helpers_1.determineTargetsFromConfig)(".", ["safari tp"]);
        const targets = (0, helpers_1.parseBrowsersListVersion)(config);
        const result = (0, mdn_provider_1.getUnsupportedTargets)(node, targets);
        expect(result).toEqual([]);
    });
});
