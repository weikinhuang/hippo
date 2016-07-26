/* eslint-env node */
/* global module, __dirname */

var path = require('path');

module.exports = {
  entry: {
    main: [
      'babel-polyfill',
      'whatwg-fetch',
      './'
    ]
  },
  output: {
    filename: 'hippo.js',
    path: __dirname + '/dist',
    crossOriginLoading: 'anonymous'
  },
  target: 'web',
  module: {
    preLoaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel'
    }]
  },
  resolve: {
    root: __dirname,
    extensions: ['', '.js'],
    fallback: [path.join(__dirname, 'node_modules')]
  }
};
