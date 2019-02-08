eslint-plugin-compat
=====================
[![Build Status](https://travis-ci.org/amilajack/eslint-plugin-compat.svg?branch=master)](https://travis-ci.org/amilajack/eslint-plugin-compat)
[![NPM version](https://badge.fury.io/js/eslint-plugin-compat.svg)](http://badge.fury.io/js/eslint-plugin-compat)
[![Dependency Status](https://img.shields.io/david/amilajack/eslint-plugin-compat.svg)](https://david-dm.org/amilajack/eslint-plugin-compat)
[![npm](https://img.shields.io/npm/dm/eslint-plugin-compat.svg)](https://npm-stat.com/charts.html?package=eslint-plugin-compat)

![demo of plugin usage](https://raw.githubusercontent.com/amilajack/eslint-plugin-compat/master/img/eslint-plugin-compat-demo.gif)

## Road Map

See the [Road Map](https://github.com/amilajack/eslint-plugin-compat/wiki) for the details.

## Installation
```bash
npm install --save-dev eslint-plugin-compat
```

Add `"compat"` to `.eslintrc` `"plugins"` section, add `"browser": true` to `"env"`, then configure the `"compat/compat"` rule.

If you use **typescript**, see [typescript-eslint](https://github.com/typescript-eslint/typescript-eslint).
```js
// .eslintrc
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
```js
// .eslintrc
{
  "extends": ["plugin:compat/recommended"]
}
```

## Idea

**Default**
```
 22:  navigator.serviceWorker
                ^^^^^^^^^^^^^ `ServiceWorker` is not supported in IE 11, Edge 15
                               and Safari 8 😢
```

## Targeting Browsers
`eslint-plugin-compat` uses the browserslist configuration in `package.json`

See [ai/browserslist](https://github.com/ai/browserslist) for configuration. Here's some examples:

```js
// Simple configuration (package.json)
{
  // ...
  "browserslist": ["last 1 versions", "not ie <= 8"],
}
```

```js
// Use development and production configurations (package.json)
{
  // ...
  "browserslist": {
    "development": ["last 2 versions"],
    "production": ["last 4 versions"]
  }
}
```

:bulb: You can also define browsers in a [separate browserslist file](https://github.com/ai/browserslist#config-file)

## Adding Polyfills
[See wiki polyfills section](https://github.com/amilajack/eslint-plugin-compat/wiki/Adding-polyfills)

## Inspiration
Toolchains for native platforms, like iOS and Android, have had API linting from the start. It's about time that the web had similar tooling.

This project was inspired by a two hour conversation I had with someone on the experience of web development and if it is terrible or not. The premise they argued was that `x` browser doesn't support `y` feature while `z` browser does. Eventually, I agreed with him on this and checked made this plugin to save web developers from having to memorize browser compatibility of specs.

## Demo
For a minimal demo, see [amilajack/eslint-plugin-compat-demo](https://github.com/amilajack/eslint-plugin-compat-demo)
