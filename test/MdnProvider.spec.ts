import determineTargetsFromConfig, { versioning } from "../src/Versioning";
import { getUnsupportedTargets } from "../src/providers/MdnProvider";

describe("MdnProvider", () => {
  it("should support Safari TP", () => {
    const node = { protoChainId: "AbortController" };
    const config = determineTargetsFromConfig(".", ["safari tp"]);
    const targets = versioning(config);
    const result = getUnsupportedTargets(node, targets);
    expect(result).toEqual([]);
  });
});
