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
      settings: { browsers: ['last 2 versions'] },
      errors: [{
        message: 'ServiceWorker is not supported in Safari 10, Opera Mobile 12.1, Opera Mini all, iOS Safari 10.0-10.2, IE Mobile 10, IE 10, Edge 14, Blackberry Browser 7, Android Browser 4.4.3-4.4.4',
        type: 'NewExpression'
      }]
    },
    {
      code: 'new IntersectionObserver(() => {}, {});',
      settings: { browsers: ['last 2 versions'] },
      errors: [{
        message: 'IntersectionObserver is not supported in Samsung Browser 4, Safari 10, Opera Mobile 12.1, Opera Mini all, iOS Safari 10.0-10.2, IE Mobile 10, IE 10, Firefox 52, Edge 14, Blackberry Browser 7, Baidu 7.12, Android Browser 4.4.3-4.4.4, Android UC Browser 11.4, QQ Browser 1.2, Android Firefox 52',
        type: 'NewExpression'
      }]
    },
    {
      code: 'WebAssembly.compile()',
      settings: { browsers: ['last 2 versions'] },
      errors: [{
        message: 'WebAssembly is not supported in Samsung Browser 4, Safari 10, Opera 43, Opera Mobile 12.1, Opera Mini all, iOS Safari 10.0-10.2, IE Mobile 10, IE 10, Edge 14, Blackberry Browser 7, Baidu 7.12, Android Browser 4.4.3-4.4.4, Android UC Browser 11.4, QQ Browser 1.2',
        type: 'MemberExpression'
      }]
    },
    {
      code: 'new PaymentRequest(methodData, details, options)',
      settings: { browsers: ['last 2 chrome versions'] },
      errors: [{
        message: 'PaymentRequest is not supported in Chrome 57',
        type: 'NewExpression'
      }]
    },
    {
      code: 'navigator.serviceWorker',
      settings: { browsers: ['last 2 versions'] },
      errors: [{
        message: 'navigator.serviceWorker() is not supported in Safari 10, Opera Mobile 12.1, Opera Mini all, iOS Safari 10.0-10.2, IE Mobile 10, IE 10, Edge 14, Blackberry Browser 7, Android Browser 4.4.3-4.4.4',
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
