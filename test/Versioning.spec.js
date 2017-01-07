import DetermineTargetsFromConfig, { Versioning } from '../src/Versioning';
import multiEnvPackageJSON from './multi-config.package.json';
import singleArrayEnvPackageJSON from './single-array-config.package.json';
import singleVersionEnvPackageJSON from './single-version-config.package.json';


describe('Versioning', () => {
  it('should support multi env config in browserslist package.json', () => {
    const config = DetermineTargetsFromConfig(multiEnvPackageJSON.browsers);
    const result = Versioning(config);

    expect(result).toEqual([
      { target: 'samsung', version: 4 },
      { target: 'safari', version: 8 },
      { target: 'opera', version: 39 },
      { target: 'op_mini', version: 'all' },
      { target: 'ios_saf', version: 8.1 },
      { target: 'ie_mob', version: 10 },
      { target: 'ie', version: 9 },
      { target: 'firefox', version: 45 },
      { target: 'edge', version: 12 },
      { target: 'chrome', version: 49 },
      { target: 'android', version: 4.4 },
      { target: 'and_uc', version: 11 },
      { target: 'and_chr', version: 55 }
    ]);
  });

  it('should support single array config in browserslist package.json', () => {
    const config = DetermineTargetsFromConfig(singleArrayEnvPackageJSON.browsers);
    const result = Versioning(config);

    expect(result).toEqual([
      { target: 'samsung', version: 4 },
      { target: 'safari', version: 8 },
      { target: 'opera', version: 39 },
      { target: 'op_mini', version: 'all' },
      { target: 'ios_saf', version: 8.1 },
      { target: 'ie_mob', version: 10 },
      { target: 'ie', version: 9 },
      { target: 'firefox', version: 45 },
      { target: 'edge', version: 12 },
      { target: 'chrome', version: 46 },
      { target: 'android', version: 4.4 },
      { target: 'and_uc', version: 11 },
      { target: 'and_chr', version: 55 }
    ]);
  });

  it('should support single version config in browserslist package.json', () => {
    const config = DetermineTargetsFromConfig(singleVersionEnvPackageJSON.browsers);
    const result = Versioning(config);

    expect(result).toEqual([
      { target: 'safari', version: 9 },
      { target: 'ie', version: 9 },
      { target: 'firefox', version: 20 },
      { target: 'chrome', version: 32 }
    ]);
  });

  it('should get lowest taret versions', () => {
    const versions = [
      'chrome 20',
      'chrome 30',
      'node 7',
      'chrome 30.5',
      'firefox 50.5'
    ];

    expect(Versioning(versions)).toEqual([
      {
        target: 'node',
        version: 7
      },
      {
        target: 'firefox',
        version: 50.5
      },
      {
        target: 'chrome',
        version: 20
      }
    ]);
  });
});
