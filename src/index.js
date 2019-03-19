/**
 * @author Amila Welihinda
 * @flow
 */

import 'v8-compile-cache';

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------
import recommended from './config/recommended';

//------------------------------------------------------------------------------
// Plugin Definition
//------------------------------------------------------------------------------

// import all rules in lib/rules
import compat from './rules/compat';

export const configs = {
  recommended
};

// Kept for backwards compatibility
export const config = configs;

export const rules = {
  compat
};
