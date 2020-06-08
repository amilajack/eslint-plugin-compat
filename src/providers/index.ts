/*
 * Step 3) Compat use CanIUse and MDN providers to check if a target browser supports a particular API
 */
import canIUseNodes from "./caniuse-provider";
import mdnNodes from "./mdn-provider";
import type { AstMetadataApiWithUnsupportedTargets } from "../types";

// eslint-disable-next-line import/prefer-default-export
export const nodes: Array<AstMetadataApiWithUnsupportedTargets> = [
  ...canIUseNodes,
  ...mdnNodes,
];
