eslint-plugin-compat
=====================
[![Build Status](https://travis-ci.org/amilajack/eslint-plugin-compat.svg?branch=master)](https://travis-ci.org/amilajack/eslint-plugin-compat)
[![Build status](https://ci.appveyor.com/api/projects/status/at71r1stbghsgcja/branch/master?svg=true)](https://ci.appveyor.com/project/amilajack/eslint-plugin-compat/branch/master)
[![NPM version](https://badge.fury.io/js/eslint-plugin-compat.svg)](http://badge.fury.io/js/eslint-plugin-compat)
[![Dependency Status](https://img.shields.io/david/amilajack/eslint-plugin-compat.svg)](https://david-dm.org/amilajack/eslint-plugin-compat)
[![npm](https://img.shields.io/npm/dm/eslint-plugin-compat.svg)](https://npm-stat.com/charts.html?package=eslint-plugin-compat)

![demo of plugin usage](https://raw.githubusercontent.com/amilajack/eslint-plugin-compat/master/eslint-plugin-compat-demo.gif)

## Goals
 - [x] Allow configuration of target browser/s
 - [x] Use [caniuse](http://caniuse.com) and [@kangax's compat table](http://kangax.github.io/compat-table/es6/) for determining coverage
 - [x] Enable config using `.eslintrc`

See the [Road Map](https://github.com/amilajack/eslint-plugin-compat/wiki) for more details

## Installation
```bash
npm install --save-dev eslint-plugin-compat
```

Add `"compat"` to `.eslintrc` `"plugins"` section, add `"browser": true` to `"env"`:
```js
// .eslintrc
{
  // ...
  "env": {
    "browser": true
  },
  "plugins": ["compat"]
}
```

## Idea

**Default**
```
 22:  navigator.serviceWorker
                ^^^^^^^^^^^^^ `ServiceWorker` is not supported in IE 11, Edge 15
                               and Safari 8 😢
```

**Targeting Browsers**
```js
// .eslintrc
{
  // ...
  settings: {
    targets: ['chrome >= 50', 'firefox', 'edge', 'safari >= 9'], // Determine target env's
    polyfills: ['simd', 'fetch'], // Indicate features to be ignored
    coverage: false, // Show the global coverage of the feature
    compiler: 'babel' // Warn against usage of API's unsupported by compiler
  }
}
```

**Explicit Error Messages**
```
 91:  const some = () => true
                   ^^^^^^^^^^ Arrow Functions are not supported by your babel preset
                              (using .babelrc)
```

## Inspiration
This project was inspired by a two hour argument I had with someone on the experience of web development and if it is terrible or not. The premise they argued was that `x` browser doesn't support `y` feature while `z` browser does. Eventually, I agreed with him on this and checked made this plugin to save web developers from having to memorize browser compatibility of specs.
