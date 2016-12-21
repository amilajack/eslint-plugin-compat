/* eslint-disable */

/**
 * @fileoverview some
 * @author Amila Welihinda
 */


//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

import requireIndex from 'requireindex';

//------------------------------------------------------------------------------
// Plugin Definition
//------------------------------------------------------------------------------


// import all rules in lib/rules
export const rules = requireIndex(`${__dirname}/rules`);
