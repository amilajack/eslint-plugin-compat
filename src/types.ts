import { Rule } from "eslint";
import { TargetNameMappings } from "./constants";

export type BrowserListConfig =
  | string
  | Array<string>
  | {
      production?: Array<string>;
      development?: Array<string>;
    }
  | null;

// @TODO Replace with types from ast-metadata-inferer
// Types from ast-metadata-inferer
type AstMetadataApi = {
  type?: string;
  name?: string;
  object: string;
  astNodeType: string; // "MemberExpression" | "CallExpression" | "NewExpression"
  property?: string;
  protoChainId: string;
  protoChain: Array<string>;
};

export interface Target {
  target: keyof TargetNameMappings;
  parsedVersion: number;
  version: number | string | "all";
}

export type HandleFailingRule = (
  node: AstMetadataApiWithUnsupportedTargets,
  eslintNode: ESLintNode
) => void;

export type TargetNames = Array<string>;

export type ESLintNode = {
  object?: AstMetadataApi;
  parent?: ESLintNode;
  expression?: ESLintNode;
  property?: AstMetadataApi;
  callee?: {
    name?: string;
    type?: string;
    computed: boolean;
    object?: AstMetadataApi;
    property?: AstMetadataApi;
  };
} & AstMetadataApi;

export interface AstMetadataApiWithUnsupportedTargets extends AstMetadataApi {
  getUnsupportedTargets: (
    node: AstMetadataApiWithUnsupportedTargets,
    targets: Target[]
  ) => Array<string>;
}

export interface Context extends Rule.RuleContext {
  settings?: {
    targets?: string[];
    browsers?: Array<string>;
    polyfills?: Array<string>;
    lintAllEsApis?: boolean;
  };
}
