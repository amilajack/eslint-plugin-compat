# compat/compat

This rule checks the browser compatibility of your code.

## Configure Target Browsers

Browser targets are configured using [browserslist](https://github.com/browserslist/browserslist). You can configure browser targets in your `package.json`:

#### `package.json`

```jsonc
{
  // ...
  "browserslist": ["chrome 70", "last 1 versions", "not ie <= 8"]
}
```

If no configuration is found, browserslist [defaults to](https://github.com/browserslist/browserslist#queries) `"> 0.5%, last 2 versions, Firefox ESR, not dead"`.

See [browserslist/browserslist](https://github.com/browserslist/browserslist) for more details.

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
