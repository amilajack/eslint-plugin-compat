import determineTargetsFromConfig, { versioning } from "../src/versioning";
import { getUnsupportedTargets } from "../src/providers/can-i-use-provider";
import expectRangeResultJSON from "./expect-range-result-config.json";

describe("CanIUseProvider", () => {
  it("should return unsupported iOS targets with range value for Fetch API", () => {
    const node = { caniuseId: "fetch" };
    const config = determineTargetsFromConfig(
      ".",
      expectRangeResultJSON.browsers
    );
    const targets = versioning(config);
    const result = getUnsupportedTargets(node, targets);
    expect(result).toMatchSnapshot();
  });
});
