// @flow
import Lint, { generateErrorName } from '../Lint';
import DetermineTargetsFromConfig, { Versioning } from '../Versioning';
import type { ESLintNode } from '../LintTypes';

type ESLint = {
  [astNodeTypeName: string]: (node: ESLintNode) => void
};

type Context = {
  node: ESLintNode,
  settings: {
    browsers: Array<string>,
    polyfills: Array<string>
  },
  getFilename: () => string,
  report: ({ node: ESLintNode, message: string }) => void
};

export type BrowserListConfig =
  | Array<string>
  | {
      production?: Array<string>,
      development?: Array<string>
    }
  | null;

export default {
  meta: {
    docs: {
      description: 'Ensure cross-browser API compatibility',
      category: 'Compatibility',
      recommended: true
    },
    fixable: 'code',
    schema: []
  },
  create(context: Context): ESLint {
    // Determine lowest targets from browserslist config, which reads user's
    // package.json config section. Use config from eslintrc for testing purposes
    const browserslistConfig: BrowserListConfig =
      context.settings.browsers || context.settings.targets;

    const browserslistTargets = Versioning(
      DetermineTargetsFromConfig(browserslistConfig)
    );

    function lint(node: ESLintNode) {
      const { isValid, rule, unsupportedTargets } = Lint(
        node,
        browserslistTargets,
        new Set(context.settings.polyfills || [])
      );

      if (!isValid) {
        context.report({
          node,
          message: [
            generateErrorName(rule),
            'is not supported in',
            unsupportedTargets.join(', ')
          ].join(' ')
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
