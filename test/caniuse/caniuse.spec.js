/* eslint no-restricted-syntax: 0, flowtype/require-valid-file-annotation: 0 */
import { SourceCode } from 'eslint';
import esprima from 'esprima';
import { expect } from 'chai';
import DetermineCompat from '../../src/DetermineCompat';
import tests from './tests';


describe('CanIUseProvider', () => {
  for (const test of tests) {
    const MemberExpression = new SourceCode(test.code, esprima.parse(test.code, {
      tokens: true,
      loc: true,
      comment: true,
      range: true,
      tolerant: true,
      attachComment: true
    }));

    const isValid = DetermineCompat(MemberExpression.ast.body[0].expression);

    it(test.name || test.id, () => {
      expect(isValid).to.equal(test.pass);
    });
  }
});
