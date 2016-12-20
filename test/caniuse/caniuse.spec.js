/* eslint no-restricted-syntax: 0, flowtype/require-valid-file-annotation: 0 */
import { linter } from 'eslint';
import { expect } from 'chai';
import DetermineCompat from '../../src/DetermineCompat';
import tests from './tests';


describe('CanIUseProvider', () => {
  for (const test of tests) {
    it(test.name || `${test.id} supported by default targets`, () => {
      const messages = linter.verify(
        test.code,
        {
          plugins: ['compat'],
          rules: {
            'compat/test': 2
          }
        },
        {
          filename: 'foo.js'
        }
      );

      console.log(messages);

      // expect(isValid).to.equal(test.pass);
    });
  }
});
