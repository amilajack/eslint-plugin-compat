// @flow
import Lint from './Lint';


export default {
  meta: {
    docs: {
      description: 'Browser API compatability ------ desc',
      category: 'Browser API compatability',
      recommended: true
    },
    fixable: 'code',
    schema: []
  },
  create(context: Object): Object {
    function lint(node: Object) {
      const isValid = Lint(node, context.settings.targets);

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
