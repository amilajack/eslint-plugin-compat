eslint-plugin-caniuse
=====================

WORK IN PROGRESS

## Goals
 - Allow configuration of target browser/s, percentage of feature supported
 - Errors should report with the list of browsers no supported and the percentage of the feature
 - Speed. This may involve caching the caniuse db
 - Only lint against ES features and Web API's that cannot be polyfilled or transpiled

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
    browsers: ['chrome', 'firefox', 'edge', 'safari'] // screw IE
}
```

```
 22:  navigator.serviceWorker
                ^^^^^^^^^^^^^ `ServiceWorker` is not supported in two of your target
                              browsers: Safari and Edge.
```

## Inspiration
This project was inspired by a two hour argument I had with someone on the experience of web development and if it is terrible or not. The premise they argued was that `x` browser doesn't support `y` feature while `z` browser does. Eventually, I agreed with him on this and checked made this plugin to save web developers from having to memorize browser compatibility of specs.
