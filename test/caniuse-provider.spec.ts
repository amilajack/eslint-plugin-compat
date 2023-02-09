import {
  determineTargetsFromConfig,
  parseBrowsersListVersion,
} from "../src/helpers";
import { getUnsupportedTargets } from "../src/providers/caniuse-provider";
import { AstMetadataApiWithTargetsResolver } from "../src/types";
import expectRangeResultJSON from "./expect-range-result-config.json";

describe("CanIUseProvider", () => {
  it("should return unsupported iOS targets with range value for Fetch API", () => {
    const node = { caniuseId: "fetch" } as AstMetadataApiWithTargetsResolver;
    const config = determineTargetsFromConfig(
      ".",
      expectRangeResultJSON.browsers
    );
    const targets = parseBrowsersListVersion(config);
    const result = getUnsupportedTargets(node, targets);
    expect(result).toMatchSnapshot();
  });
});
