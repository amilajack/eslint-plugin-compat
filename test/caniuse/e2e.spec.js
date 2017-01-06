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
        message: 'ServiceWorker is not supported in latest Safari, Edge',
        type: 'NewExpression'
      }]
    },
    {
      code: 'new IntersectionObserver(() => {}, {});',
      errors: [{
        message: 'IntersectionObserver is not supported in latest Firefox, Safari',
        type: 'NewExpression'
      }]
    },
    {
      code: 'WebAssembly.compile()',
      errors: [{
        message: 'WebAssembly is not supported in latest Chrome, Firefox, Safari, Edge',
        type: 'MemberExpression'
      }]
    },
    {
      code: 'new PaymentRequest(methodData, details, options)',
      settings: { targets: ['chrome'] },
      errors: [{
        message: 'PaymentRequest is not supported in latest Chrome',
        type: 'NewExpression'
      }]
    },
    {
      code: 'navigator.serviceWorker',
      errors: [{
        message: 'navigator.serviceWorker() is not supported in latest Safari, Edge',
        type: 'MemberExpression'
      }]
    },
    {
      code: 'fetch("google.com")',
      settings: { targets: ['ie'] },
      errors: [{
        message: 'fetch is not supported in latest IE',
        type: 'CallExpression'
      }]
    }
  ]
});
