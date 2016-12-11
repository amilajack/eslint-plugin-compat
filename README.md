eslint-plugin-compat
=====================
[![Build Status](https://travis-ci.org/amilajack/eslint-plugin-compat.svg?branch=master)](https://travis-ci.org/amilajack/eslint-plugin-compat)
[![Build status](https://ci.appveyor.com/api/projects/status/ag1pm0a914bed8c8/branch/master?svg=true)](https://ci.appveyor.com/project/amilajack/eslint-plugin-compat/branch/master)
[![NPM version](https://badge.fury.io/js/eslint-plugin-compat.svg)](http://badge.fury.io/js/eslint-plugin-compat)
[![Dependency Status](https://img.shields.io/david/amilajack/eslint-plugin-compat.svg)](https://david-dm.org/amilajack/eslint-plugin-compat)
[![npm](https://img.shields.io/npm/dm/eslint-plugin-compat.svg)](https://npm-stat.com/charts.html?package=eslint-plugin-compat)

WORK IN PROGRESS

## Goals
 - Allow configuration of target browser/s, percentage of feature supported
 - Errors should report with the list of browsers no supported and the percentage of the feature
 - Speed. This may involve caching the caniuse db
 - Only lint against ES features and Web API's that cannot be polyfilled or transpiled
 - Use [caniuse](http://caniuse.com) and [@kangax's compta table](http://kangax.github.io/compat-table/es6/) as endpoints for determining coverage
 - Check the environment using `.eslintrc` and enable rules like such.
```js
 "env": {
    "browser": true,
    "node": true,
    "es6": true
  },
```

## Idea

**Default**
```
 22:  navigator.serviceWorker
                ^^^^^^^^^^^^^ `ServiceWorker` is not supported in IE, Edge and Safari.
                               Has about 60% browser coverage 😢
```

**Targeting Browsers**
```js
// in `.eslintrc`
{
    browsers: ['chrome >= 50', 'firefox', 'edge', 'safari >= 9'] // screw IE
    compiler: 'babel'
}
```

```
 22:  navigator.serviceWorker
                ^^^^^^^^^^^^^ `ServiceWorker` is not supported in two of your target
                              browsers: Safari and Edge.
```

## Inspiration
This project was inspired by a two hour argument I had with someone on the experience of web development and if it is terrible or not. The premise they argued was that `x` browser doesn't support `y` feature while `z` browser does. Eventually, I agreed with him on this and checked made this plugin to save web developers from having to memorize browser compatibility of specs.
