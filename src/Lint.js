// @flow
import type { Node, ESLintNode } from "./LintTypes";

export function lintCallExpression(
  reporter: Function,
  rules: Array<Node>,
  node: ESLintNode
) {
  if (!node.callee) return;
  const calleeName = node.callee.name;
  const failingRule = rules.find(rule => rule.object === calleeName);
  if (failingRule) reporter(failingRule, node);
}

export function lintNewExpression(
  reporter: Function,
  rules: Array<Node>,
  node: ESLintNode
) {
  if (!node.callee) return;
  const calleeName = node.callee.name;
  const failingRule = rules.find(rule => rule.object === calleeName);
  if (failingRule) reporter(failingRule, node);
}

export function lintMemberExpression(
  reporter: Function,
  rules: Array<Node>,
  node: ESLintNode
) {
  if (!node.object || !node.property) return;
  const objectName = node.object.name;
  const propertyName = node.property.name;
  const failingRule = rules.find(
    rule =>
      rule.object === objectName &&
      (rule.property == null || rule.property === propertyName)
  );
  if (failingRule) reporter(failingRule, node);
}
