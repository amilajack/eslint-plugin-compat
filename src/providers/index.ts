import canIUseNodes from "./can-i-use-provider";
import mdnNodes from "./mdn-provider";
import type { Node } from "../types";

// eslint-disable-next-line import/prefer-default-export
export const nodes: Array<Node> = [...canIUseNodes, ...mdnNodes];
