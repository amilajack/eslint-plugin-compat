/*
 * Step 3) Compat use CanIUse and MDN providers to check if a target browser supports a particular API
 */
import canIUseNodes from "./caniuse-provider";
import mdnNodes from "./mdn-provider";
import type { AstMetadataApiWithTargetsResolver } from "../types";

export const nodes: Array<AstMetadataApiWithTargetsResolver> = [
  ...canIUseNodes,
  ...mdnNodes,
];
