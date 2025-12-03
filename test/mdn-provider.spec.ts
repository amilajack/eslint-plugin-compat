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

  it("should return unsupported targets for AbortSignal.any in older browsers", () => {
    const node = {
      protoChainId: "AbortSignal.any",
    } as AstMetadataApiWithTargetsResolver;
    const config = determineTargetsFromConfig(".", [
      "chrome 115",
      "safari 17",
      "firefox 123",
    ]);
    const targets = parseBrowsersListVersion(config);
    const result = getUnsupportedTargets(node, targets);
    expect(result).toEqual(["Safari 17.0", "Firefox 123", "Chrome 115"]);
  });

  it("should return empty for AbortSignal.any in supported browsers", () => {
    const node = {
      protoChainId: "AbortSignal.any",
    } as AstMetadataApiWithTargetsResolver;
    const config = determineTargetsFromConfig(".", [
      "chrome 116",
      "safari 17.4",
      "firefox 124",
    ]);
    const targets = parseBrowsersListVersion(config);
    const result = getUnsupportedTargets(node, targets);
    expect(result).toEqual([]);
  });

  it("should return unsupported targets for AbortSignal.abort in older browsers", () => {
    const node = {
      protoChainId: "AbortSignal.abort",
    } as AstMetadataApiWithTargetsResolver;
    const config = determineTargetsFromConfig(".", [
      "chrome 92",
      "safari 14",
      "firefox 87",
    ]);
    const targets = parseBrowsersListVersion(config);
    const result = getUnsupportedTargets(node, targets);
    expect(result).toEqual(["Safari 14", "Firefox 87", "Chrome 92"]);
  });

  it("should return empty for AbortSignal.abort in supported browsers", () => {
    const node = {
      protoChainId: "AbortSignal.abort",
    } as AstMetadataApiWithTargetsResolver;
    const config = determineTargetsFromConfig(".", [
      "chrome 93",
      "safari 15",
      "firefox 88",
    ]);
    const targets = parseBrowsersListVersion(config);
    const result = getUnsupportedTargets(node, targets);
    expect(result).toEqual([]);
  });

  it("should return unsupported targets for AbortSignal.timeout in older browsers", () => {
    const node = {
      protoChainId: "AbortSignal.timeout",
    } as AstMetadataApiWithTargetsResolver;
    const config = determineTargetsFromConfig(".", [
      "chrome 102",
      "safari 15",
      "firefox 99",
    ]);
    const targets = parseBrowsersListVersion(config);
    const result = getUnsupportedTargets(node, targets);
    expect(result).toEqual(["Safari 15", "Firefox 99", "Chrome 102"]);
  });

  it("should return empty for AbortSignal.timeout in supported browsers", () => {
    const node = {
      protoChainId: "AbortSignal.timeout",
    } as AstMetadataApiWithTargetsResolver;
    const config = determineTargetsFromConfig(".", [
      "chrome 124",
      "safari 16",
      "firefox 100",
    ]);
    const targets = parseBrowsersListVersion(config);
    const result = getUnsupportedTargets(node, targets);
    expect(result).toEqual([]);
  });
});
