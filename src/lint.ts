import { Node, ESLintNode } from "./types";

function isInsideIfStatement(context) {
  return context.getAncestors().some((ancestor) => {
    return ancestor.type === "IfStatement";
  });
}

function checkNotInsideIfStatementAndReport(
  context,
  reporter,
  failingRule,
  node
) {
  if (!isInsideIfStatement(context)) {
    reporter(failingRule, node);
  }
}

export function lintCallExpression(
  context,
  reporter: Function,
  rules: Array<Node>,
  node: ESLintNode
) {
  if (!node.callee) return;
  const calleeName = node.callee.name;
  const failingRule = rules.find((rule) => rule.object === calleeName);
  if (failingRule)
    checkNotInsideIfStatementAndReport(context, reporter, failingRule, node);
}

export function lintNewExpression(
  context,
  reporter: Function,
  rules: Array<Node>,
  node: ESLintNode
) {
  if (!node.callee) return;
  const calleeName = node.callee.name;
  const failingRule = rules.find((rule) => rule.object === calleeName);
  if (failingRule)
    checkNotInsideIfStatementAndReport(context, reporter, failingRule, node);
}

export function lintExpressionStatement(
  context,
  reporter: Function,
  rules: Node[],
  node: ESLintNode
) {
  if (!node?.expression?.name) return;
  const failingRule = rules.find(
    (rule) => rule.object === node.expression.name
  );
  if (failingRule)
    checkNotInsideIfStatementAndReport(context, reporter, failingRule, node);
}

function protoChainFromMemberExpression(node: ESLintNode): string {
  if (!node.object) return [node.name];
  const protoChain = (() => {
    switch (node.object.type) {
      case "NewExpression":
      case "CallExpression":
        return protoChainFromMemberExpression(node.object.callee);
      default:
        return protoChainFromMemberExpression(node.object);
    }
  })();
  return [...protoChain, node.property.name];
}

export function lintMemberExpression(
  context,
  reporter: Function,
  rules: Array<Node>,
  node: ESLintNode
) {
  if (!node.object || !node.property) return;
  if (
    !node.object.name ||
    node.object.name === "window" ||
    node.object.name === "globalThis"
  ) {
    const rawProtoChain = protoChainFromMemberExpression(node);
    const [firstObj] = rawProtoChain;
    const protoChain =
      firstObj === "window" || firstObj === "globalThis"
        ? rawProtoChain.slice(1)
        : rawProtoChain;
    const protoChainId = protoChain.join(".");
    const failingRule = rules.find(
      (rule) => rule.protoChainId === protoChainId
    );
    if (failingRule) {
      checkNotInsideIfStatementAndReport(context, reporter, failingRule, node);
    }
  } else {
    const objectName = node.object.name;
    const propertyName = node.property.name;
    const failingRule = rules.find(
      (rule) =>
        rule.object === objectName &&
        (rule.property == null || rule.property === propertyName)
    );
    if (failingRule)
      checkNotInsideIfStatementAndReport(context, reporter, failingRule, node);
  }
}
