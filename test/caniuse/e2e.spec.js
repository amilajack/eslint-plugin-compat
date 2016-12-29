/* eslint flowtype/require-valid-file-annotation: 0 */
import { RuleTester } from 'eslint';
import rule from '../../src/rules/compat';


const ruleTester = new RuleTester({
  parserOptions: { ecmaVersion: 2015 }
});

ruleTester.run('compat', rule, {
  valid: [
    'document.querySelector()',
    {
      code: 'new ServiceWorker()',
      settings: { targets: ['chrome', 'firefox'] }
    },
    {
      code: 'document.currentScript()'
    },
    {
      code: "document.currentScript('some')"
    },
    {
      code: 'WebAssembly.compile()',
      settings: { targets: ['chrome', 'firefox'] }
    },
    {
      code: 'WebAssembly.compile()',
      settings: { polyfills: ['wasm'] }
    },
    {
      code: 'new IntersectionObserver(() => {}, {});',
      settings: { targets: ['chrome'] }
    }
  ],
  invalid: [
    // TODO: Atomcis are not yet supported by caniuse
    //
    // {
    //   code: 'Atomics.store()',
    //   errors: [{
    //     message: 'Unsupported API being used',
    //     type: 'MemberExpression'
    //   }]
    // },
    {
      code: 'new ServiceWorker()',
      errors: [{
        message: 'Unsupported API being used',
        type: 'NewExpression'
      }]
    },
    {
      code: 'new IntersectionObserver(() => {}, {});',
      errors: [{
        message: 'Unsupported API being used',
        type: 'NewExpression'
      }]
    },
    {
      code: 'WebAssembly.compile()',
      errors: [{
        message: 'Unsupported API being used',
        type: 'MemberExpression'
      }]
    },
    {
      code: 'navigator.serviceWorker',
      errors: [{
        message: 'Unsupported API being used',
        type: 'MemberExpression'
      }]
    },
    {
      code: 'fetch("google.com")',
      settings: { targets: ['ie'] },
      errors: [{
        message: 'Unsupported API being used',
        type: 'CallExpression'
      }]
    }
  ]
});
