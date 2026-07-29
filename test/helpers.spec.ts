import path from "path";
import {
  determineTargetsFromConfig,
  parseBrowsersListVersion,
} from "../src/helpers";
import multiEnvPackageJSON from "./multi-config.package.json";
import singleArrayEnvPackageJSON from "./single-array-config.package.json";
import singleVersionEnvPackageJSON from "./single-version-config.package.json";

describe("Versioning", () => {
  it("should support multi env config in browserslist package.json", () => {
    const config = determineTargetsFromConfig(
      ".",
      multiEnvPackageJSON.browsers
    );
    const result = parseBrowsersListVersion(config);
    expect(result).toMatchSnapshot();
  });

  it("should support resolving browserslist config in subdirectory", () => {
    // This should resolve the ./test/.browserslistrc config
    const relativeConfig = determineTargetsFromConfig(
      path.join(__dirname, ".browserslistrc")
    );
    const rootConfig = determineTargetsFromConfig(
      require.resolve("../package.json")
    );
    const relativeConfigVersions = parseBrowsersListVersion(relativeConfig);
    expect(relativeConfigVersions).toMatchSnapshot();
    const rootConfigVersions = parseBrowsersListVersion(rootConfig);
    expect(rootConfigVersions).toMatchSnapshot();

    expect(relativeConfigVersions).not.toEqual(rootConfigVersions);
  });

  it("should support single array config in browserslist package.json", () => {
    const config = determineTargetsFromConfig(
      ".",
      singleArrayEnvPackageJSON.browsers
    );
    const result = parseBrowsersListVersion(config);
    expect(result).toMatchSnapshot();
  });

  it("should support single version config in browserslist package.json", () => {
    const config = determineTargetsFromConfig(
      ".",
      singleVersionEnvPackageJSON.browsers
    );
    const result = parseBrowsersListVersion(config);
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
    expect(parseBrowsersListVersion(versions)).toMatchSnapshot();
  });

  it("should support string config in rule option", () => {
    const config = determineTargetsFromConfig(".", "defaults, not ie < 9");
    const result = parseBrowsersListVersion(config);
    expect(result).toMatchSnapshot();
  });

  it("should support object config in rule option", () => {
    const config = determineTargetsFromConfig(
      path.join(__dirname, ".browserslistrc"),
      {
        query: "node 18",
      }
    );
    const result = parseBrowsersListVersion(config);
    expect(result).toMatchSnapshot();
  });

  it("should support object config with query array in rule option", () => {
    const config = determineTargetsFromConfig(
      path.join(__dirname, ".browserslistrc"),
      {
        query: ["node 18"],
      }
    );
    const result = parseBrowsersListVersion(config);
    expect(result).toMatchSnapshot();
  });

  it("should support object config with ignore option in rule option", () => {
    const config = determineTargetsFromConfig(
      path.join(__dirname, ".browserslistrc"),
      {
        query: "node 18",
        ignoreBrowserslistTargets: true,
      }
    );
    const result = parseBrowsersListVersion(config);
    expect(result).toMatchSnapshot();
  });

  it("should fail on incorrect browserslist target version", () => {
    expect(() => {
      determineTargetsFromConfig(".", "edge 100000");
    }).toThrow("Unknown version 100000 of edge");
  });
});
