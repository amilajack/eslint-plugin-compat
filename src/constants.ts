/* eslint import/prefer-default-export: off */

export interface TargetNameMappings {
  chrome: "Chrome";
  firefox: "Firefox";
  safari: "Safari";
  ios_saf: "iOS Safari";
  ie: "IE";
  ie_mob: "IE Mobile";
  edge: "Edge";
  baidu: "Baidu";
  electron: "Electron";
  blackberry_browser: "Blackberry Browser";
  edge_mobile: "Edge Mobile";
  and_uc: "Android UC Browser";
  and_chrome: "Android Chrome";
  and_firefox: "Android Firefox";
  and_webview: "Android Webview";
  and_samsung: "Samsung Browser";
  and_opera: "Opera Android";
  opera: "Opera";
  opera_mini: "Opera Mini";
  opera_mobile: "Opera Mobile";
  node: "Node.js";
  kaios: "KaiOS";
}

// Maps an ID to the full name user will see
// E.g. during error, user will see full name instead of ID
export const STANDARD_TARGET_NAME_MAPPING: Readonly<TargetNameMappings> = {
  chrome: "Chrome",
  firefox: "Firefox",
  safari: "Safari",
  ios_saf: "iOS Safari",
  ie: "IE",
  ie_mob: "IE Mobile",
  edge: "Edge",
  baidu: "Baidu",
  electron: "Electron",
  blackberry_browser: "Blackberry Browser",
  edge_mobile: "Edge Mobile",
  and_uc: "Android UC Browser",
  and_chrome: "Android Chrome",
  and_firefox: "Android Firefox",
  and_webview: "Android Webview",
  and_samsung: "Samsung Browser",
  and_opera: "Opera Android",
  opera: "Opera",
  opera_mini: "Opera Mini",
  opera_mobile: "Opera Mobile",
  node: "Node.js",
  kaios: "KaiOS",
};

export interface AstNodeTypes {
  member_expression: "MemberExpression";
  call_expression: "CallExpression";
  new_expression: "NewExpression";
}

export const AST_NODE_TYPES: Readonly<AstNodeTypes> = {
  member_expression: "MemberExpression",
  call_expression: "CallExpression",
  new_expression: "NewExpression",
};
