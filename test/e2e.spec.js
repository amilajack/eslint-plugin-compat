/* eslint flowtype/require-valid-file-annotation: 0 */
import { RuleTester } from 'eslint';
import rule from '../src/rules/compat';


const ruleTester = new RuleTester({
  parserOptions: { ecmaVersion: 2015 }
});

ruleTester.run('compat', rule, {
  valid: [
    'document.querySelector()',
    {
      code: 'new ServiceWorker()',
      settings: { browsers: ['last 2 chrome versions', 'last 2 firefox versions'] }
    },
    {
      code: 'document.currentScript()',
      settings: {
        browsers: [
          'last 2 chrome versions',
          'last 2 firefox versions',
          'last 2 safari versions',
          'last 2 edge versions'
        ]
      }
    },
    {
      code: "document.currentScript('some')",
      settings: {
        browsers: [
          'last 2 chrome versions',
          'last 2 firefox versions',
          'last 2 safari versions',
          'last 2 edge versions'
        ]
      }
    },
    {
      code: 'WebAssembly.compile()',
      settings: { polyfills: ['wasm'] }
    },
    {
      code: 'new IntersectionObserver(() => {}, {});',
      settings: { browsers: ['last 2 chrome versions'] }
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
        message: 'ServiceWorker is not supported in Safari 9.1, iOS Safari 9.3, IE Mobile 10, IE 10, Edge 13',
        type: 'NewExpression'
      }]
    },
    {
      code: 'new IntersectionObserver(() => {}, {});',
      errors: [{
        message: 'IntersectionObserver is not supported in Safari 9.1, iOS Safari 9.3, IE Mobile 10, IE 10, Firefox 49, Edge 13',
        type: 'NewExpression'
      }]
    },
    {
      code: 'WebAssembly.compile()',
      errors: [{
        message: 'WebAssembly is not supported in Safari 9.1, Opera 41, iOS Safari 9.3, IE Mobile 10, IE 10, Firefox 49, Edge 13, Chrome 54',
        type: 'MemberExpression'
      }]
    },
    {
      code: 'new PaymentRequest(methodData, details, options)',
      settings: { browsers: ['last 2 chrome versions'] },
      errors: [{
        message: 'PaymentRequest is not supported in Chrome 54',
        type: 'NewExpression'
      }]
    },
    {
      code: 'navigator.serviceWorker',
      errors: [{
        message: 'navigator.serviceWorker() is not supported in Safari 9.1, iOS Safari 9.3, IE Mobile 10, IE 10, Edge 13',
        type: 'MemberExpression'
      }]
    },
    {
      code: 'fetch("google.com")',
      settings: { browsers: ['last 2 ie versions'] },
      errors: [{
        message: 'fetch is not supported in IE 10',
        type: 'CallExpression'
      }]
    }
  ]
});
