import determineTargetsFromConfig, { versioning } from "../src/versioning";
import { getUnsupportedTargets } from "../src/providers/mdn-provider";

describe("MdnProvider", () => {
  it("should support Safari TP", () => {
    const node = { protoChainId: "AbortController" };
    const config = determineTargetsFromConfig(".", ["safari tp"]);
    const targets = versioning(config);
    const result = getUnsupportedTargets(node, targets);
    expect(result).toEqual([]);
  });
});
