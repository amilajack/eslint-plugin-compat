# compat/compat

This rule enables linting your code for browser compatibility.

## This will be reported

```js
// Targeting IE
fetch('https://exmaple.com');
```

## This will not be reported

```js
// Using default browser targets
fetch('https://exmaple.com');
```
