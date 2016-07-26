/* eslint-env node */
// Karma configuration
// Generated on Tue Dec 10 2013 23:10:32 GMT-0500 (EST)

'use strict';

var webpackConfig = require('./webpack.config.js');
// delete webpackConfig.entry;
webpackConfig.devtool = 'eval';


module.exports = function(config) {
  config.set({
    basePath: '',

    frameworks: ['mocha', 'chai', 'sinon-chai'],

    files: [
      'node_modules/babel-polyfill/dist/polyfill.js',
      require.resolve('whatwg-fetch'),
      // 'node_modules/chai-as-promised/lib/chai-as-promised.js',
      'test/specs/**/*.js'
    ],

    coverageReporter: {
      reporters: [
        {
          type: 'text-summary'
        },
        {
          type: 'html',
          dir: 'coverage/'
        }
      ]
    },

    preprocessors: {
      'test/**/*.js': ['webpack']
    },

    reporters: ['progress' /*, 'coverage'*/],

    mochaReporter: {
      ignoreSkipped: true
    },

    webpack: webpackConfig,

    webpackMiddleware: {
      noInfo: true
    },

    port: 9876,

    colors: true,

    logLevel: config.LOG_INFO,

    autoWatch: true,

    browsers: ['PhantomJS'],

    singleRun: false
  });
};
