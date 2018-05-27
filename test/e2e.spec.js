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
      settings: { browsers: ['chrome 57', 'firefox 50'] }
    },
    {
      code: 'document.currentScript()',
      settings: {
        browsers: [
          'chrome 57',
          'firefox 50',
          'safari 10',
          'edge 14'
        ]
      }
    },
    {
      code: "document.currentScript('some')",
      settings: {
        browsers: [
          'chrome 57',
          'firefox 50',
          'safari 10',
          'edge 14'
        ]
      }
    },
    {
      code: 'WebAssembly.compile()',
      settings: { polyfills: ['wasm'] }
    },
    {
      code: 'new IntersectionObserver(() => {}, {});',
      settings: { browsers: ['chrome 58'] }
    },
    {
      code: "new URL('http://example')",
      settings: {
        browsers: [
          'chrome 32',
          'safari 7.1',
          'firefox 26'
        ]
      }
    },
    {
      code: 'new URLSearchParams()',
      settings: {
        browsers: [
          'chrome 49',
          'safari 10.1',
          'firefox 44'
        ]
      }
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
      settings: { browsers: ['chrome 31'] },
      errors: [{
        message: 'ServiceWorker is not supported in Chrome 31',
        type: 'NewExpression'
      }]
    },
    {
      code: 'new IntersectionObserver(() => {}, {});',
      settings: { browsers: ['chrome 49'] },
      errors: [{
        message: 'IntersectionObserver is not supported in Chrome 49',
        type: 'NewExpression'
      }]
    },
    {
      code: 'WebAssembly.compile()',
      settings: {
        browsers: [
          'Samsung 4', 'Safari 10.1', 'Opera 12.1', 'OperaMini all', 'iOS 10.3', 'ExplorerMobile 10', 'IE 10', 'Edge 14', 'Blackberry 7', 'Baidu 7.12', 'UCAndroid 11.8', 'QQAndroid 1.2'
        ]
      },
      errors: [{
        message: 'WebAssembly is not supported in Samsung Browser 4, Safari 10.1, Opera 12.1, Opera Mini all, iOS Safari 10.3, IE Mobile 10, IE 10, Edge 14, Blackberry Browser 7, Baidu 7.12, Android UC Browser 11.8, QQ Browser 1.2',
        type: 'MemberExpression'
      }]
    },
    {
      code: 'new PaymentRequest(methodData, details, options)',
      settings: { browsers: ['chrome 57'] },
      errors: [{
        message: 'PaymentRequest is not supported in Chrome 57',
        type: 'NewExpression'
      }]
    },
    {
      code: 'navigator.serviceWorker',
      settings: { browsers: ['safari 10.1'] },
      errors: [{
        message: 'navigator.serviceWorker() is not supported in Safari 10.1',
        type: 'MemberExpression'
      }]
    },
    {
      code: 'fetch("google.com")',
      settings: { browsers: ['ie 11'] },
      errors: [{
        message: 'fetch is not supported in IE 11',
        type: 'CallExpression'
      }]
    },
    {
      code: 'new Promise()',
      settings: { browsers: ['ie 10'] },
      errors: [{
        message: 'Promise is not supported in IE 10',
        type: 'NewExpression'
      }]
    },
    {
      code: 'Promise.resolve()',
      settings: { browsers: ['ie 10'] },
      errors: [{
        message: 'Promise.resolve() is not supported in IE 10',
        type: 'MemberExpression'
      }]
    },
    {
      code: 'Promise.all()',
      settings: { browsers: ['ie 10'] },
      errors: [{
        message: 'Promise.all() is not supported in IE 10',
        type: 'MemberExpression'
      }]
    },
    {
      code: 'Promise.race()',
      settings: { browsers: ['ie 10'] },
      errors: [{
        message: 'Promise.race() is not supported in IE 10',
        type: 'MemberExpression'
      }]
    },
    {
      code: 'Promise.reject()',
      settings: { browsers: ['ie 10'] },
      errors: [{
        message: 'Promise.reject() is not supported in IE 10',
        type: 'MemberExpression'
      }]
    },
    {
      code: "new URL('http://example')",
      settings: {
        browsers: [
          'chrome 31',
          'safari 7',
          'firefox 25'
        ]
      },
      errors: [{
        message: 'URL is not supported in Safari 7, Firefox 25, Chrome 31',
        type: 'NewExpression'
      }]
    },
    {
      code: 'new URLSearchParams()',
      settings: {
        browsers: [
          'chrome 48',
          'safari 10',
          'firefox 28'
        ]
      },
      errors: [{
        message: 'URLSearchParams is not supported in Safari 10, Firefox 28, Chrome 48',
        type: 'NewExpression'
      }]
    }
  ]
});
