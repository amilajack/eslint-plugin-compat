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
  report: () => void
};

function getName(node) {
  switch (node.type) {
    case 'NewExpression': {
      return node.callee.name;
    }
    case 'MemberExpression': {
      return node.object.name;
    }
    case 'CallExpression': {
      return node.callee.name;
    }
    default:
      throw new Error('not found');
  }
}

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
      context.settings.browsers ||
      context.settings.targets ||
      context.options[0];

    const browserslistTargets = Versioning(
      DetermineTargetsFromConfig(browserslistConfig)
    );

    const errors = [];

    function lint(node: ESLintNode) {
      const { isValid, rule, unsupportedTargets } = Lint(
        node,
        browserslistTargets,
        new Set(context.settings.polyfills || [])
      );

      if (!isValid) {
        errors.push({
          node,
          message: [
            generateErrorName(rule),
            'is not supported in',
            unsupportedTargets.join(', ')
          ].join(' ')
        });
      }
    }

    const identifiers = new Set();

    return {
      CallExpression: lint,
      MemberExpression: lint,
      NewExpression: lint,
      // Keep track of all the defined variables. Do not report errors for nodes that are not defined
      Identifier(node) {
        if (node.parent) {
          const { type } = node.parent;
          if (
            type === 'FunctionDeclaration' ||
            type === 'VariableDeclarator' ||
            type === 'ClassDeclaration' ||
            type === 'ImportDefaultSpecifier' ||
            type === 'ImportSpecifier' ||
            type === 'ImportDeclaration'
          ) {
            identifiers.add(node.name);
          }
        }
      },
      'Program:exit': () => {
        // Get a map of all the variables defined in the root scope (not the global scope)
        // const variablesMap = context.getScope().childScopes.map(e => e.set)[0];
        errors
          .filter(error => !identifiers.has(getName(error.node)))
          .forEach(node => context.report(node));
      }
    };
  }
};
