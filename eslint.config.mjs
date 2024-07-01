import { includeIgnoreFile } from '@eslint/compat';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import eslint from '@eslint/js';
import eslintPlugin from 'eslint-plugin-eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import compat from './lib/esm/src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, '.gitignore');

export default [
  includeIgnoreFile(gitignorePath),
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPlugin.configs['flat/recommended'],
  compat.configs['flat/recommended'],
  eslintConfigPrettier,
  {
    files: ["**/*.ts", "**/*.js", "**/*.mjs"],
    rules: {
      'no-template-curly-in-string': ['error'],
      'no-console': ['warn']
    },
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node
      }
    }
  }
];

/*
    parserOptions: {
      project: './tsconfig.json'
    },
    "extends": [
      "airbnb-typescript/base",
      "plugin:import/typescript",
    ],
    "rules": {
      "import/extensions": "off",
      "import/no-extraneous-dependencies": "off"
    },
*/
