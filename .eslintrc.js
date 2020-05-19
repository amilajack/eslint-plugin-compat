module.exports = {
  extends: "bliss",
  env: {
    node: true,
    jest: true,
  },
  root: true,
  overrides: [
    {
      files: ["*.ts"],
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint"],
      extends: [
        "bliss",
        "airbnb-typescript/base",
        "plugin:import/typescript",
        "plugin:prettier/recommended",
        "prettier/@typescript-eslint",
      ],
      env: {
        node: true,
        jest: true,
      },
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
  ],
};
