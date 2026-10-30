const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

// Con el transformador de Babel normal, Metro 0.76 truena con «Helpers are not supported by
// the default hub» en async/await. metro-babel-transformer.js lo corrige.
module.exports = mergeConfig(getDefaultConfig(__dirname), {
  transformer: {
    babelTransformerPath: path.resolve(__dirname, 'metro-babel-transformer.js'),
  },
});
