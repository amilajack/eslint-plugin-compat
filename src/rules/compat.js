// @flow
import Lint from '../Lint';
import type { ESLintNode } from '../Lint'; // eslint-disable-line


type ESLint = {
  [x: string]: (node: ESLintNode) => void
}

type Context = {
  node: ESLintNode,
  settings: {
    targets: Array<string>,
    polyfills: Array<string>
  },
  report: () => void
}

export default {
  meta: {
    docs: {
      description: 'Ensure cross-browser API compatability',
      category: 'Compatability',
      recommended: true
    },
    fixable: 'code',
    schema: []
  },
  create(context: Context): ESLint {
    function lint(node: ESLintNode) {
      const isValid = Lint(
        node,
        context.settings.targets,
        context.settings.polyfills
          ? new Set(context.settings.polyfills)
          : undefined
      );

      // HACK: Eventually, we'll have an error message returned from Lint
      // const { isValid, message } = Lint(context);

      if (!isValid) {
        context.report({
          node,
          message: 'Unsupported API being used'
        });
      }
    }

    return {
      // HACK: Ideally, rules will be generated at runtime. Each rule will have
      //       have the ability to register itself to run on specific AST
      //       nodes. For now, we're using the `CallExpression` node since
      //       its what most rules will run on
      MemberExpression: lint,
      NewExpression: lint
    };
  }
};
