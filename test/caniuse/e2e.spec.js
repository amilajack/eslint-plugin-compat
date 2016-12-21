/* eslint no-restricted-syntax: 0, flowtype/require-valid-file-annotation: 0 */
import { RuleTester } from 'eslint';
import rule from '../../src/index';


const ruleTester = new RuleTester();

ruleTester.run('compat', rule, {
  valid: [
    'document.querySelector()',
    {
      code: 'new ServiceWorker()',
      settings: { targets: ['chrome', 'firefox'] }
    },
    {
      code: 'document.currentScript()',
      errors: [{
        message: 'Unsupported API being used',
        type: 'MemberExpression'
      }]
    },
    {
      code: "document.currentScript('some')",
      errors: [{
        message: 'Unsupported API being used',
        type: 'MemberExpression'
      }]
    },
    {
      code: 'WebAssembly.compile()',
      settings: { targets: ['chrome', 'firefox'] }
    }
  ],
  invalid: [
    {
      code: 'new ServiceWorker()',
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
    }
  ]
});
