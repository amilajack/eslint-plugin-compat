import { APIKind } from "ast-metadata-inferer/lib/types";
import type { Options as DefaultBrowsersListOpts } from "browserslist";
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
  astNodeType:
    | "MemberExpression"
    | "CallExpression"
    | "NewExpression"
    | "Literal";
  property?: string;
  syntaxes?: string[];
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
  regex?: {
    flags: string;
    pattern: string;
  };
  raw: string;
};

export type SourceCode = import("eslint").SourceCode;

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
    browserslistOpts?: BrowsersListOpts;
  };
}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface BrowsersListOpts
  extends Exclude<DefaultBrowsersListOpts, "path"> {}
