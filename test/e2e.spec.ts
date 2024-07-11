import { RuleTester } from "eslint";
import rule from "../src/rules/compat";
import { parser } from "typescript-eslint";

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: { ecmaVersion: 2020, sourceType: "module" },
  },
  settings: {
    lintAllEsApis: true,
  },
});

ruleTester.run("compat", rule, {
  valid: [
    // Ignore ES APIs if config detected
    {
      code: `
        Array.from()
      `,
      settings: { browsers: ["ExplorerMobile 10"] },
    },
    // Feature detection Cases
    {
      code: `
        if (fetch) {
          fetch()
        }
      `,
      settings: { browsers: ["ExplorerMobile 10"] },
    },
    {
      code: `
        if (Array.prototype.flat) {
          new Array.flat()
        }
      `,
      settings: { browsers: ["ExplorerMobile 10"] },
    },
    {
      code: `
        if (fetch && otherConditions) {
          fetch()
        }
      `,
      settings: { browsers: ["ExplorerMobile 10"] },
    },
    {
      code: `
        if (window.fetch) {
          fetch()
        }
      `,
      settings: { browsers: ["ExplorerMobile 10"] },
    },
    {
      code: `
        if ('fetch' in window) {
          fetch()
        }
      `,
      settings: { browsers: ["ExplorerMobile 10"] },
    },
    {
      code: "window",
      settings: { browsers: ["ExplorerMobile 10"] },
    },
    {
      code: "document.fonts()",
      settings: { browsers: ["edge 79"] },
    },
    // Import cases
    {
      code: `
        import { Set } from 'immutable';
        new Set();
      `,
      settings: { browsers: ["ie 9"] },
    },
    {
      code: `
        const { Set } = require('immutable');
        new Set();
      `,
      settings: { browsers: ["ie 9"] },
    },
    {
      code: `
        const { Set } = require('immutable');
        new Set();
      `,
      settings: { browsers: ["current node"] },
    },
    {
      code: `
        const { Set } = require('immutable');
        new Set();
      `,
      settings: { browsers: ["ie 9", "current node"] },
    },
    {
      code: `
        const Set = require('immutable').Set;
        new Set();
      `,
      settings: { browsers: ["ie 9"] },
    },
    {
      code: `
        Promise.resolve()
      `,
      settings: { browsers: ["node 10"] },
    },
    {
      code: `
        const { Set } = require('immutable');
        (() => {
          new Set();
        })();
      `,
      settings: { browsers: ["ie 9"] },
    },
    {
      code: `
        import Set from 'immutable';
        new Set();
      `,
      settings: { browsers: ["ie 9"] },
    },
    {
      code: `
        function Set() {}
        new Set();
      `,
      settings: { browsers: ["ie 9"] },
    },
    {
      code: `
        const Set = () => {};
        new Set();
      `,
      settings: { browsers: ["ie 9"] },
    },
    {
      code: `
        const bar = () => {
          const Set = () => {};
          new Set();
        }
      `,
      settings: { browsers: ["ie 9"] },
    },
    {
      code: `
        const bar = () => {
          class Set {}
          new Set()
        }
      `,
      settings: { browsers: ["ie 9"] },
    },
    {
      code: `
        const bar = () => {
          const Set = {}
          new Set()
        }
      `,
      settings: { browsers: ["ie 9"] },
    },
    {
      code: `
        const bar = () => {
          function Set() {}
          new Set()
        }
      `,
      settings: { browsers: ["ie 9"] },
    },
    {
      code: "document.documentElement()",
      settings: { browsers: ["Safari 11", "Opera 57", "Edge 17"] },
    },
    {
      code: "document.getElementsByTagName()",
      settings: { browsers: ["Safari 11", "Opera 57", "Edge 17"] },
    },
    {
      code: 'Promise.resolve("foo")',
      settings: { polyfills: ["Promise"], browsers: ["ie 8"] },
    },
    {
      code: "history.back()",
      settings: { browsers: ["Safari 11", "Opera 57", "Edge 17"] },
    },
    "document.querySelector()",
    {
      code: "new ServiceWorker()",
      settings: { browsers: ["chrome 57", "firefox 50"] },
    },
    {
      code: "document.currentScript()",
      settings: {
        browsers: ["chrome 57", "firefox 50", "safari 10", "edge 14"],
      },
    },
    {
      code: "document.querySelector()",
      settings: {
        browsers: ["ChromeAndroid 80"],
      },
    },
    {
      code: "document.hasFocus()",
      settings: {
        browsers: ["Chrome 27"],
      },
    },
    {
      code: "new URL()",
      settings: {
        browsers: ["ChromeAndroid 78", "ios 11"],
      },
    },
    {
      code: "document.currentScript('some')",
      settings: {
        browsers: ["chrome 57", "firefox 50", "safari 10", "edge 14"],
      },
    },
    {
      code: "WebAssembly.compile()",
      settings: {
        browsers: ["chrome 40"],
        polyfills: ["WebAssembly", "WebAssembly.compile"],
      },
    },
    {
      code: "new IntersectionObserver(() => {}, {});",
      settings: { browsers: ["chrome 58"] },
    },
    {
      code: "new URL('http://example')",
      settings: {
        browsers: ["chrome 32", "safari 7.1", "firefox 26"],
      },
    },
    {
      code: "new URLSearchParams()",
      settings: {
        browsers: ["chrome 49", "safari 10.1", "firefox 44"],
      },
    },
  ],
  invalid: [
    {
      code: "window?.fetch?.('example.com')",
      settings: { browsers: ["ie 9"] },
      errors: [
        {
          message: "fetch is not supported in IE 9",
        },
      ],
    },
    {
      settings: {
        browsers: ["ie 9"],
      },
      code: `
        navigator.hardwareConcurrency;
        navigator.serviceWorker;
        new SharedWorker();
      `,
      errors: [
        {
          message: "navigator.hardwareConcurrency() is not supported in IE 9",
        },
        {
          message: "navigator.serviceWorker() is not supported in IE 9",
        },
        {
          message: "SharedWorker is not supported in IE 9",
        },
      ],
    },
    {
      settings: {
        browsers: ["ie 8"],
      },
      code: `
        // it should throw an error here, but it doesn't
        const event = new CustomEvent("cat", {
          detail: {
            hazcheeseburger: true
          }
        });
        window.dispatchEvent(event);
      `,
      errors: [
        {
          message: "CustomEvent is not supported in IE 8",
        },
      ],
    },
    {
      code: "Array.from()",
      settings: {
        browsers: ["ie 8"],
      },
      errors: [
        {
          message: "Array.from() is not supported in IE 8",
        },
      ],
    },
    {
      code: "Promise.allSettled()",
      settings: {
        browsers: [
          "Chrome >= 72",
          "Firefox >= 72",
          "Safari >= 12",
          "Edge >= 79",
        ],
      },
      errors: [
        {
          message:
            "Promise.allSettled() is not supported in Safari 12, Chrome 72",
        },
      ],
    },
    {
      code: "location.origin",
      settings: { browsers: ["ie 10"] },
      errors: [
        {
          message: "location.origin() is not supported in IE 10",
        },
      ],
    },
    {
      code: `
          import { Map } from 'immutable';
          new Set()
        `,
      settings: { browsers: ["ie 9"] },
      errors: [
        {
          message: "Set is not supported in IE 9",
          type: "NewExpression",
        },
      ],
    },
    {
      code: "new Set()",
      settings: { browsers: ["ie 9"] },
      errors: [
        {
          message: "Set is not supported in IE 9",
          type: "NewExpression",
        },
      ],
    },
    {
      code: "new TypedArray()",
      settings: { browsers: ["ie 9"] },
      errors: [
        {
          message: "TypedArray is not supported in IE 9",
          type: "NewExpression",
        },
      ],
    },
    {
      code: "new Int8Array()",
      settings: { browsers: ["ie 9"] },
      errors: [
        {
          message: "Int8Array is not supported in IE 9",
          type: "NewExpression",
        },
      ],
    },
    {
      code: "new AnimationEvent",
      settings: { browsers: ["chrome 40"] },
      errors: [
        {
          message: "AnimationEvent is not supported in Chrome 40",
          type: "NewExpression",
        },
      ],
    },
    {
      code: "Object.values({})",
      settings: { browsers: ["safari 9"] },
      errors: [
        {
          message: "Object.values() is not supported in Safari 9",
          type: "MemberExpression",
        },
      ],
    },
    {
      code: "new ServiceWorker()",
      settings: { browsers: ["chrome 31"] },
      errors: [
        {
          message: "ServiceWorker is not supported in Chrome 31",
          type: "NewExpression",
        },
      ],
    },
    {
      code: "new IntersectionObserver(() => {}, {});",
      settings: { browsers: ["chrome 49"] },
      errors: [
        {
          message: "IntersectionObserver is not supported in Chrome 49",
          type: "NewExpression",
        },
      ],
    },
    {
      code: "WebAssembly.compile()",
      settings: {
        browsers: [
          "Samsung 4",
          "Safari 10.1",
          "Opera 12.1",
          "OperaMini all",
          "iOS 10.3",
          "ExplorerMobile 10",
          "IE 10",
          "Edge 14",
          "Blackberry 7",
          "Baidu 7.12",
          "UCAndroid 11.8",
          "QQAndroid 1.2",
        ],
      },
      errors: [
        {
          message:
            "WebAssembly is not supported in Safari 10.1, Opera 12.1, iOS Safari 10.3, IE 10, Edge 14",
          type: "MemberExpression",
        },
      ],
    },
    {
      code: "new PaymentRequest(methodData, details, options)",
      settings: { browsers: ["chrome 57"] },
      errors: [
        {
          message: "PaymentRequest is not supported in Chrome 57",
          type: "NewExpression",
        },
      ],
    },
    {
      code: "navigator.serviceWorker",
      settings: { browsers: ["safari 10.1"] },
      errors: [
        {
          message: "navigator.serviceWorker() is not supported in Safari 10.1",
          type: "MemberExpression",
        },
      ],
    },
    {
      code: "window.document.fonts()",
      settings: { browsers: ["ie 8"] },
      errors: [
        {
          message: "document.fonts() is not supported in IE 8",
          type: "MemberExpression",
        },
      ],
    },
    {
      code: "new Map().size",
      settings: { browsers: ["ie 8"] },
      errors: [
        {
          message: "Map.size() is not supported in IE 8",
          type: "MemberExpression",
        },
        {
          message: "Map is not supported in IE 8",
          type: "NewExpression",
        },
      ],
    },
    {
      code: "new window.Map().size",
      settings: { browsers: ["ie 8"] },
      errors: [
        {
          message: "Map.size() is not supported in IE 8",
          type: "MemberExpression",
        },
        {
          message: "Map is not supported in IE 8",
          type: "MemberExpression",
        },
      ],
    },
    {
      code: "new Array().flat",
      settings: { browsers: ["ie 8"] },
      errors: [
        {
          message: "Array.flat() is not supported in IE 8",
          type: "MemberExpression",
        },
      ],
    },
    {
      code: "globalThis.fetch()",
      settings: { browsers: ["ie 11"] },
      errors: [
        {
          message: "fetch is not supported in IE 11",
          type: "MemberExpression",
        },
      ],
    },
    {
      code: "fetch()",
      settings: { browsers: ["ie 11"] },
      errors: [
        {
          message: "fetch is not supported in IE 11",
          type: "CallExpression",
        },
      ],
    },
    {
      code: "Promise.resolve()",
      settings: { browsers: ["ie 10"] },
      errors: [
        {
          message: "Promise.resolve() is not supported in IE 10",
          type: "MemberExpression",
        },
      ],
    },
    {
      code: "Promise.all()",
      settings: { browsers: ["ie 10"] },
      errors: [
        {
          message: "Promise.all() is not supported in IE 10",
          type: "MemberExpression",
        },
      ],
    },
    {
      code: "Promise.race()",
      settings: { browsers: ["ie 10"] },
      errors: [
        {
          message: "Promise.race() is not supported in IE 10",
          type: "MemberExpression",
        },
      ],
    },
    {
      code: "Promise.reject()",
      settings: { browsers: ["ie 10"] },
      errors: [
        {
          message: "Promise.reject() is not supported in IE 10",
          type: "MemberExpression",
        },
      ],
    },
    {
      code: "new URL('http://example')",
      settings: {
        browsers: ["chrome 31", "safari 7", "firefox 25"],
      },
      errors: [
        {
          message: "URL is not supported in Safari 7, Firefox 25, Chrome 31",
          type: "NewExpression",
        },
      ],
    },
    {
      code: "new URLSearchParams()",
      settings: {
        browsers: ["chrome 48", "safari 10", "firefox 28"],
      },
      errors: [
        {
          message:
            "URLSearchParams is not supported in Safari 10, Firefox 28, Chrome 48",
          type: "NewExpression",
        },
      ],
    },
    {
      code: "performance.now()",
      settings: { browsers: ["ie 9"] },
      errors: [
        {
          message: "performance.now() is not supported in IE 9",
          type: "MemberExpression",
        },
      ],
    },
    {
      code: "new ResizeObserver()",
      settings: {
        browsers: ["ie 11", "safari 12"],
      },
      errors: [
        {
          message: "ResizeObserver is not supported in Safari 12, IE 11",
        },
      ],
    },
    {
      code: "'foo'.at(5)",
      settings: {
        browsers: ["ie 11", "safari 12"],
      },
      errors: [
        {
          message: "String.at() is not supported in Safari 12, IE 11",
        },
      ],
    },
    {
      code: "[].at(5)",
      settings: {
        browsers: ["ie 11", "safari 12"],
      },
      errors: [
        {
          message: "Array.at() is not supported in Safari 12, IE 11",
        },
      ],
    },
    // @TODO: Fix this edge case
    // {
    //   code: `window?.fetch`,
    //   settings: { browsers: ["ie 9"] },
    //   errors: [
    //     {
    //       message: "fetch is not supported in IE 9",
    //     },
    //   ],
    // },
    {
      code: "Object.entries({}), Object.values({})",
      settings: {
        browsers: ["Android >= 4", "iOS >= 7"],
      },
      errors: [
        {
          message: "Object.entries() is not supported in iOS Safari 7.0-7.1",
        },
        {
          message: "Object.values() is not supported in iOS Safari 7.0-7.1",
        },
      ],
    },
    {
      code: "window.requestIdleCallback(() => {})",
      settings: {
        browsers: ["safari 12"],
      },
      errors: [
        {
          message: "requestIdleCallback is not supported in Safari 12",
        },
      ],
    },
    {
      code: "window.requestAnimationFrame(() => {})",
      settings: {
        browsers: ["OperaMini all"],
      },
      errors: [
        {
          message: "requestAnimationFrame is not supported in op_mini all",
        },
      ],
    },
  ],
});
