/* jshint node: true */
/* eslint-env node */

module.exports = {
  basePath: '',

  frameworks: ['mocha', 'requirejs', 'sinon-chai'],

  files: [
    { pattern: 'node_modules/chai-as-promised/lib/chai-as-promised.js', included: false },
    { pattern: 'bower_components/**/*.js', included: false },
    { pattern: 'lib/**/*.js', included: false },
    { pattern: 'index.js', included: false },
    { pattern: 'test/specs/**/*.js', included: false },

    'test/main.js'
  ],

  preprocessors: {
    'lib/**/*.js': ['coverage'],
  },

  reporters: ['progress', 'coverage'],

  coverageReporter: {
    type: 'text'
  },

  port: 9876,
  colors: true,
  logLevel: 'info',
  autoWatch: true,
  browsers: ['PhantomJS'],
  captureTimeout: 60000,
  singleRun: false
};
