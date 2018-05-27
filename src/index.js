/**
 * @author Amila Welihinda
 * @flow
 */


//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

import requireIndex from 'requireindex';
import recommended from './config/recommended';


export const config = {
  recommended
};

//------------------------------------------------------------------------------
// Plugin Definition
//------------------------------------------------------------------------------


// import all rules in lib/rules
export const rules = requireIndex(`${__dirname}/rules`);
