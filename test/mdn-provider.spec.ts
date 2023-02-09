import {
  determineTargetsFromConfig,
  parseBrowsersListVersion,
} from "../src/helpers";
import { getUnsupportedTargets } from "../src/providers/mdn-provider";
import { AstMetadataApiWithTargetsResolver } from "../src/types";

describe("MdnProvider", () => {
  it("should support Safari TP", () => {
    const node = {
      protoChainId: "AbortController",
    } as AstMetadataApiWithTargetsResolver;
    const config = determineTargetsFromConfig(".", ["safari tp"]);
    const targets = parseBrowsersListVersion(config);
    const result = getUnsupportedTargets(node, targets);
    expect(result).toEqual([]);
  });
});
