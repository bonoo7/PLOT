const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Force CJS resolution for packages that use `import.meta` in their ESM builds.
// Without this, Metro picks `zustand/esm/middleware.mjs` via the "import" condition,
// which contains `import.meta.env` — invalid in a bundled (non-module) script.
config.resolver.unstable_conditionNames = [
    'react-native',
    'require',
    'default',
];

module.exports = config;
