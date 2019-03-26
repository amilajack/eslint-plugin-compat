// @flow
import Lint, { generateErrorName } from '../Lint';
import DetermineTargetsFromConfig, { Versioning } from '../Versioning';
import type { ESLintNode, Node } from '../LintTypes';

type ESLint = {
  [astNodeTypeName: string]: (node: ESLintNode) => void
};

type Context = {
  node: ESLintNode,
  settings: {
    browsers?: Array<string>,
    targets?: Array<string>,
    polyfills?: Array<string>,
    records?: Array<Node>
  },
  options: Array<string>,
  getFilename: () => string,
  report: (x: Node) => void
};

type AstNodeType =
  | {
      type: string,
      callee: {
        name: string
      }
    }
  | {
      type: string,
      object?: {
        name: string
      }
    };

function getName(node: AstNodeType): string {
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

    const { records = [] } = context.settings;

    const browserslistTargets = Versioning(
      DetermineTargetsFromConfig(browserslistConfig)
    );

    const errors: Array<Node> = [];

    const collectErrors = (node: ESLintNode) => {
      const { recordMatchesNode, rule, unsupportedTargets } = Lint(
        node,
        browserslistTargets,
        new Set(context.settings.polyfills || []),
        records
      );

      if (!recordMatchesNode) {
        errors.push({
          node,
          message: [
            generateErrorName(rule),
            'is not supported in',
            unsupportedTargets.join(', ')
          ].join(' ')
        });
      }
    };

    const identifiers = new Set();

    return {
      CallExpression: collectErrors,
      MemberExpression: collectErrors,
      NewExpression: collectErrors,
      // Keep track of all the defined variables. Do not report errors for nodes that are not defined
      Identifier(node: { name: string, parent?: { type: string } }): void {
        if (node.parent) {
          const { type } = node.parent;
          if (
            // ex. const { Set } = require('immutable');
            type === 'Property' ||
            // ex. function Set() {}
            type === 'FunctionDeclaration' ||
            // ex. const Set = () => {}
            type === 'VariableDeclarator' ||
            // ex. class Set {}
            type === 'ClassDeclaration' ||
            // ex. import Set from 'set';
            type === 'ImportDefaultSpecifier' ||
            // ex. import {Set} from 'set';
            type === 'ImportSpecifier' ||
            // ex. import {Set} from 'set';
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
