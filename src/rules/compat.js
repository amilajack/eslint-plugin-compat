// @flow
import Lint from '../Lint';
import type { ESLintNode } from '../Lint'; // eslint-disable-line


type ESLint = {
  [x: string]: (node: ESLintNode) => void
};

type Context = {
  node: ESLintNode,
  settings: {
    targets: Array<string>,
    polyfills: Array<string>
  },
  report: () => void
};

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
    // FIXME: lint() creates a new Set on every invocation. Fix this by removing
    //        creating a single set and passing a refrence lint() a reference
    //        to it
    //
    // FIXME: Another performance enhancement includes collecting all the rules
    //        into a single list. As of now, every call to lint() must find
    //        all the corresponding AST node rules.
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
      CallExpression: lint,
      MemberExpression: lint,
      NewExpression: lint
    };
  }
};
