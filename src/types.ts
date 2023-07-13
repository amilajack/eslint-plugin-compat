import { APIKind } from "ast-metadata-inferer/lib/types";
import { Rule } from "eslint";
import { TargetNameMappings } from "./constants";

export type BrowserListConfig =
  | string
  | Array<string>
  | {
      production?: Array<string>;
      development?: Array<string>;
    }
  | {
      ignoreBrowserslistTargets?: boolean;
      query: string | Array<string>;
    }
  | null;

// @TODO Replace with types from ast-metadata-inferer
// Types from ast-metadata-inferer
type AstMetadataApi = {
  type?: string;
  name?: string;
  object: string;
  astNodeType: "MemberExpression" | "CallExpression" | "NewExpression";
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
  node: AstMetadataApiWithTargetsResolver,
  eslintNode: ESLintNode
) => void;

export type TargetNames = Array<string>;

export type ESLintNode = {
  name: string;
  type: string;
  value?: unknown;
  object?: ESLintNode;
  parent?: ESLintNode;
  expression?: ESLintNode;
  property?: ESLintNode;
  callee?: ESLintNode & {
    name: string;
    type?: string;
  };
};

export interface AstMetadataApiWithTargetsResolver extends AstMetadataApi {
  id: string;
  caniuseId?: string;
  kind?: APIKind;
  getUnsupportedTargets: (
    node: AstMetadataApiWithTargetsResolver,
    targets: Target[]
  ) => Array<string>;
}

export interface Context extends Rule.RuleContext {
  settings: {
    targets?: string[];
    browsers?: Array<string>;
    polyfills?: Array<string>;
    lintAllEsApis?: boolean;
  };
}
