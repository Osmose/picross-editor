/* eslint-env node */
var path = require('path');
var webpack = require('webpack');
var UglifyJSPlugin = require('uglifyjs-webpack-plugin');

var production = process.env.NODE_ENV === 'production';
var plugins = [];
if (production) {
  plugins.concat([
    new webpack.DefinePlugin({
      process: {
        env: {
          NODE_ENV: '"production"',
        },
      },
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false
    }),
    new UglifyJSPlugin({
      uglifyOptions: {
        ie8: false,
        ecma: 7,
      },
    }),
  ]);
}

module.exports = {
  entry: './src/js/index.js',
  output: {
    path: path.resolve(__dirname, 'src'),
    filename: 'js/bundle.js',
  },
  devtool: 'source-map',
  plugins: plugins,
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          'babel-loader',
        ],
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ],
      },
      {
        test: /\.(eot|svg|ttf|woff(2)?)(\?v=\d+\.\d+\.\d+)?/,
        use: [
          'file-loader',
        ],
      },
    ],
  },
  devServer: {
    contentBase: path.resolve(__dirname, 'src'),
    port: 9000
  },
};
