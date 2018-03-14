/**
 * @fileoverview some
 * @author Amila Welihinda
 * @flow
 */


//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

import requireIndex from 'requireindex'; // eslint-disable-line flowtype-errors/show-errors
import recommended from './config/recommended';


export const configs = {
  recommended
};

//------------------------------------------------------------------------------
// Plugin Definition
//------------------------------------------------------------------------------


// import all rules in lib/rules
export const rules = requireIndex(`${__dirname}/rules`);
