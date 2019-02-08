// @flow
import CanIUse from './CanIUseProvider';
import Mdn from './MdnProvider';
import type { Node } from '../LintTypes';

// eslint-disable-next-line import/prefer-default-export
export const rules: Array<Node> = [...CanIUse, ...Mdn];
