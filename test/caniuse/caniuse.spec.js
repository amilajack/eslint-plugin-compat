// @flow
import path from 'path';
import { SourceCode } from 'eslint';
import esprima from 'esprima';
import { readFileSync } from 'fs';
import DetermineCompat from '../../src/DetermineCompat';


const file = readFileSync(path.join(__dirname, 'example.js')).toString();

const MemberExpression = new SourceCode(file, esprima.parse(file, {
  tokens: true,
  loc: true,
  comment: true,
  range: true,
  tolerant: true,
  attachComment: true
}));

const isValid = DetermineCompat(MemberExpression.ast.body[0].expression);
console.log(isValid);
