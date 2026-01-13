# compat/compat

This rule enables linting your code for browser compatibility.

## This will be reported

```js
// Targeting IE
fetch("https://exmaple.com");
```

## This will not be reported

```js
// Using default browser targets
fetch("https://exmaple.com");
```

## Conditional Checks

By default, feature detection like `if (fetch) { ... }` does not trigger a
report. Set `settings.ignoreConditionalChecks` to `true` to lint these
conditionals.
