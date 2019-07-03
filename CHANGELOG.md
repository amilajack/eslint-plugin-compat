## v3.3.0
### Performance
- Filter and sort rules before node traversal ([https://github.com/amilajack/eslint-plugin-compat/pull/246](https://github.com/amilajack/eslint-plugin-compat/pull/246))
- Optimize core loop to run ~50% faster ([https://github.com/amilajack/eslint-plugin-compat/pull/245](https://github.com/amilajack/eslint-plugin-compat/pull/245))

## v3.2.0
### Added
- Support for `eslint@6`

## v3.1.2
### Fixed
- Remove npm restriction from engines

## v3.1.1
### Fixed
- Resolving browserslist config correctly despite being called from a cwd that is not the root of the project. (#217)

## v3.1.0
### Added
- Support detecting locally defined polyfills (#207)  bb3be6e

## v3.0.2
### Fixed
- Handle entire API polyfill case (#190)  e784b3d

## v3.0.1
### Fixed
- Bug when returning unsupported when mdn compat data has null record

## v3.0.0
### Added
- Support for ~4000 JS API's using [ast-metadata-inferer](https://github.com/amilajack/ast-metadata-inferer)

### Deprecated
- Using caniuse id's for polyfills is no longer supported

## v2.7.0
### Added
- `Object.values()` support

## v2.6.1
### Fixed
- Removed `console.log` statement

## v2.4.0
### Updated
- Updated all deps to latest semver
### Fixed
- Fixed recommendation config

## v2.3.0
### Updated
- Updated browserslist

## v2.2.0
### Updated
- Bumped all dependencies to latest semver

## v2.1.0
### Added
- Promise support

## v2.0.1
### Fixed
- Corrected incorrect babel exports config that prevented plugin from being loaded

## v2.0.0
### Updated
- Bumped all dependencies to latest semver
### Infra
- Removed boilerplate from `.eslintrc`
- Run CI against node 8
- Removed flow-typed definitions
- Updated tests to reflect dependency changes

## v1.0.4
### Fixed
- Required `peerDependency` of `eslint>=4.0.0`

## v1.0.3
### Updated
- Bumped all dependencies to latest semver

## v1.0.2
### Added
- Range implementation
