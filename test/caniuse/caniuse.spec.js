// @flow
import { SourceCode } from 'eslint';
import path from 'path';
import esprima from 'esprima';
import { readFileSync } from 'fs';
import some from '../../src/DetermineCompat'


const file = readFileSync(path.join(__dirname, 'example.js')).toString();

const MemberExpression = new SourceCode(file, esprima.parse(file, {
  tokens: true,
  loc: true,
  comment: true,
  range: true,
  tolerant: true,
  attachComment: true
}));
