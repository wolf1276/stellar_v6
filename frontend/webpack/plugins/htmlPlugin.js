const
  path              = require('path'),
  manifest          = require('../manifest'),
  HtmlWebpackPlugin = require('html-webpack-plugin');

const titles = {
  'index': 'SIE | Command Center',
};

let minify = {
  collapseWhitespace: false,
  minifyCSS: false,
  minifyJS: false,
  removeComments: true,
  useShortDoctype: false,
};

if (manifest.MINIFY) {
  minify = {
    collapseWhitespace: true,
    minifyCSS: true,
    minifyJS: true,
    removeComments: true,
    useShortDoctype: true,
  };
}


module.exports = [
  new HtmlWebpackPlugin({
    template: path.join(manifest.paths.src, 'pages', 'index.html'),
    path: manifest.paths.build,
    filename: 'index.html',
    inject: true,
    minify,
  })
];
