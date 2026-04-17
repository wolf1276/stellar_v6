const
  path              = require('path'),
  manifest          = require('../manifest'),
  CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = new CopyWebpackPlugin({
  patterns: [
    {
      from : path.join(manifest.paths.src, 'public'),
      to   : path.join(manifest.paths.build, 'assets'),
    },
  ],
});
