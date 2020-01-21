import DetermineTargetsFromConfig, { Versioning } from '../src/Versioning';
import { getUnsupportedTargets } from '../src/providers/MdnProvider';

describe('MdnProvider', () => {
  it('should support Safari TP', () => {
    const node = { protoChainId: 'AbortController' };
    const config = DetermineTargetsFromConfig('.', ['safari tp']);
    const targets = Versioning(config);
    const result = getUnsupportedTargets(node, targets);
    expect(result).toEqual([]);
  });
});
