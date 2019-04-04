eslint-plugin-compat
=====================
[![Build Status](https://dev.azure.com/amilajack/amilajack/_apis/build/status/amilajack.eslint-plugin-compat?branchName=master)](https://dev.azure.com/amilajack/amilajack/_build/latest?definitionId=7&branchName=master)
[![NPM version](https://badge.fury.io/js/eslint-plugin-compat.svg)](http://badge.fury.io/js/eslint-plugin-compat)
[![Dependency Status](https://img.shields.io/david/amilajack/eslint-plugin-compat.svg)](https://david-dm.org/amilajack/eslint-plugin-compat)
[![npm](https://img.shields.io/npm/dm/eslint-plugin-compat.svg)](https://npm-stat.com/charts.html?package=eslint-plugin-compat)
[![Backers on Open Collective](https://opencollective.com/eslint-plugin-compat/backers/badge.svg)](#backers) [![Sponsors on Open Collective](https://opencollective.com/eslint-plugin-compat/sponsors/badge.svg)](#sponsors)

Lint the browser compatibility of your code

![demo of plugin usage](https://raw.githubusercontent.com/amilajack/eslint-plugin-compat/master/img/eslint-plugin-compat-demo.gif)

## Road Map

See the [Road Map](https://github.com/amilajack/eslint-plugin-compat/wiki) for the details.

## Installation

```bash
npm install --save-dev eslint-plugin-compat
```

Add `"compat"` to `.eslintrc.*` `"plugins"` section, add `"browser": true` to `"env"`, then configure the `"compat/compat"` rule:

```jsonc
// .eslintrc.json
{
  // ...
  "env": {
    "browser": true
  },
  "plugins": ["compat"],
  "rules": {
    // ...
    "compat/compat": "error"
  }
}
```

Alternatively, you can use the `recommended` configuration which will do this for you, with the `"compat/compat"` rule reporting errors (as in the snippet above).
```jsonc
// .eslintrc.json
{
  "extends": ["plugin:compat/recommended"]
}
```

## Targeting Browsers

`eslint-plugin-compat` uses the browserslist configuration in `package.json` or the rule configuration in `.eslintrc.*`. If no configuration is found, browserslist [defaults to](https://github.com/browserslist/browserslist#queries) `> 0.5%, last 2 versions, Firefox ESR, not dead`.

See [browserslist/browserslist](https://github.com/browserslist/browserslist) for configuration. Here's some examples:

Simple configuration in `package.json`

```jsonc
{
  // ...
  "browserslist": ["last 1 versions", "not ie <= 8"],
}
```

Rule configuration in `.eslintrc.json`
```jsonc
{
  // ...
  "rules": {
    "compat/compat": ["error", "defaults, not ie < 9"]
  }
}
```

Use development and production configurations in `package.json`
```jsonc
{
  // ...
  "browserslist": {
    "development": ["last 2 versions"],
    "production": ["last 4 versions"]
  }
}
```

:bulb: You can also define browsers in a [separate browserslist file](https://github.com/browserslist/browserslist#config-file)

## Adding Polyfills

#### v3

Add polyfills to the settings section of your eslint config. Append the name of the object and the property if one exists. Here are some examples:

```jsonc
{
  // ...
  "settings": {
    "polyfills": [
      // Example of marking entire API and all methods and properties as polyfilled
      "Promise",
      // Example of marking specific method of an API as polyfilled
      "WebAssembly.compile",
      // Example of API with no property (i.e. a function)
      "fetch",
      // Example of instance method, must add `.prototype.`
      "Array.prototype.push"
    ]
  }
}
```

#### v2

[See wiki polyfills section](https://github.com/amilajack/eslint-plugin-compat/wiki/Adding-polyfills)

## Demo
For a minimal demo, see [amilajack/eslint-plugin-compat-demo](https://github.com/amilajack/eslint-plugin-compat-demo)

## Advanced
* [Allowing Custom Records](https://github.com/amilajack/eslint-plugin-compat/wiki/Custom-Compatibility-Records)

## Support

If this project is saving you (or your team) time, please consider supporting it on Patreon 👍 thank you!

<p>
  <a href="https://www.patreon.com/amilajack">
    <img src="https://c5.patreon.com/external/logo/become_a_patron_button@2x.png" width="160">
  </a>
</p>

## Inspiration

Toolchains for native platforms, like iOS and Android, have had API linting from the start. It's about time that the web had similar tooling.

This project was inspired by a two hour conversation I had with someone on the experience of web development and if it is terrible or not. The premise they argued was that `x` browser doesn't support `y` feature while `z` browser does. Eventually, I agreed with him on this and checked made this plugin to save web developers from having to memorize browser compatibility of specs.

## Related

* [ast-metadata-inferer](https://github.com/amilajack/ast-metadata-inferer)
* [compat-db](https://github.com/amilajack/compat-db)
