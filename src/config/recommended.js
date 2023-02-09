"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Reconmmended configs for this plugin
exports.default = {
    plugins: ["compat"],
    env: {
        browser: true,
    },
    rules: {
        "compat/compat": "error",
    },
};
