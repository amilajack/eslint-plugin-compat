// @flow
import Kangax from './KangaxProvider';
import CanIUse from './CanIUseProvider';
import type { Node } from '../LintTypes';

export const rules: Array<Node> = [...Kangax, ...CanIUse];

export default {};
