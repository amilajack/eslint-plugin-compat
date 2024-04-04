import { expectTypeOf } from "expect-type";
import plugin from "../src/index";
import type { Linter } from "eslint";
import tseslint from "typescript-eslint";

describe("flat configs typing", () => {
  it("should be compatible with @types/eslint ", () => {
    expectTypeOf([plugin.configs["flat/recommended"]]).toMatchTypeOf<
      Linter.FlatConfig[]
    >();
  });

  it("should be compatible with `tseslint.config()`", () => {
    tseslint.config(plugin.configs["flat/recommended"]);

    tseslint.config({
      extends: [plugin.configs["flat/recommended"]],
    });
  });
});
