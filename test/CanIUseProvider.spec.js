import determineTargetsFromConfig, { versioning } from "../src/Versioning";
import { getUnsupportedTargets } from "../src/providers/CanIUseProvider";
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
