module.exports = {
  env: {
    node: true,
    jest: true,
  },
  root: true,
  parser: "@typescript-eslint/parser",
  extends: [
    "airbnb-typescript/base",
    "plugin:eslint-plugin/recommended",
    "plugin:import/typescript",
    "plugin:prettier/recommended",
  ],
  parserOptions: {
    project: "./tsconfig.json",
  },
};
