module.exports = {
  env: {
    node: true,
    jest: true,
  },
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: [
    "bliss",
    "airbnb-typescript/base",
    "plugin:import/typescript",
    "plugin:prettier/recommended",
    "prettier/@typescript-eslint",
  ],
  parserOptions: {
    project: "./tsconfig.json",
  },
};
