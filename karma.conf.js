/* eslint-env node */
// Karma configuration
// Generated on Tue Dec 10 2013 23:10:32 GMT-0500 (EST)

'use strict';

var webpackConfig = require('./webpack.config.js');
webpackConfig.devtool = 'eval';

module.exports = function(config) {
  config.set({
    basePath: '',

    frameworks: ['jasmine', 'sinon'],

    files: [
      'node_modules/babel-polyfill/dist/polyfill.js',
      require.resolve('whatwg-fetch'),
      require.resolve('jasmine-stray-timers'),
      require.resolve('jasmine-stray-promises'),
      'test/index.js'
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
      'test/index.js': ['webpack']
    },

    reporters: ['progress', 'coverage'],

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
