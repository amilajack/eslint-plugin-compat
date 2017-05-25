import DetermineTargetsFromConfig, { Versioning } from '../src/Versioning';
import { getUnsupportedTargets } from '../src/providers/CanIUseProvider';
import expectRangeResultJSON from './expect-range-result-config.json';


describe('CanIUseProvider', () => {
  it('should return unsupported ios targets with range value for Fetch API', () => {
    const node = { id: 'fetch' };
    const config = DetermineTargetsFromConfig(expectRangeResultJSON.browsers);
    const targets = Versioning(config);
    const result = getUnsupportedTargets(node, targets);
    expect(result).toMatchSnapshot();
  });
});
