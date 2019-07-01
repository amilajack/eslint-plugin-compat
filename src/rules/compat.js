// @flow
import memoize from 'lodash.memoize';
import Lint, { generateErrorName } from '../Lint';
import DetermineTargetsFromConfig, { Versioning } from '../Versioning';
import type { ESLintNode, BrowserListConfig } from '../LintTypes';
import { rules } from '../providers';

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

let x;
const getTargetedRules = memoize(targetsJSON =>
  rules.filter(
    rule => rule.getUnsupportedTargets(rule, JSON.parse(targetsJSON)).length > 0
  )
);

export default {
  meta: {
    docs: {
      description: 'Ensure cross-browser API compatibility',
      category: 'Compatibility',
      url:
        'https://github.com/amilajack/eslint-plugin-compat/blob/master/docs/rules/compat.md',
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
      DetermineTargetsFromConfig(context.getFilename(), browserslistConfig)
    );

    // Stringify to support memoization; browserslistConfig is always an array of new objects.
    const targetedRules = getTargetedRules(JSON.stringify(browserslistTargets));

    const errors = [];

    function lint(node: ESLintNode) {
      const failingRule = Lint(
        node,
        targetedRules,
        new Set(context.settings.polyfills || [])
      );

      if (failingRule == null) return;

      errors.push({
        node,
        message: [
          generateErrorName(failingRule),
          'is not supported in',
          failingRule
            .getUnsupportedTargets(failingRule, browserslistTargets)
            .join(', ')
        ].join(' ')
      });
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
