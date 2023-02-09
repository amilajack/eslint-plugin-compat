"use strict";
/**
 * Step 1) Entry point of plugin. Exports itself for eslint to use
 * @author Amila Welihinda
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rules = exports.config = exports.configs = void 0;
//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------
const recommended_1 = __importDefault(require("./config/recommended"));
//------------------------------------------------------------------------------
// Plugin Definition
//------------------------------------------------------------------------------
// import all rules in lib/rules
const compat_1 = __importDefault(require("./rules/compat"));
exports.configs = {
    recommended: recommended_1.default,
};
// Kept for backwards compatibility
exports.config = exports.configs;
exports.rules = {
    compat: compat_1.default,
};
