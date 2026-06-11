const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase's JS SDK ships ESM "exports" that Metro resolves to the wrong
// build on native, crashing auth at runtime. Disable exports resolution.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
