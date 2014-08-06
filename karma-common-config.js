/* jshint node: true */

module.exports = {
  basePath: '',

  frameworks: ['mocha', 'requirejs', 'chai'],

  files: [
    {pattern: 'lib/**/*.js', included: false},
    {pattern: 'index.js', included: false},
    {pattern: 'test/specs/**/*.js', included: false},

    'test/main.js'
  ],

  // preprocess matching files before serving them to the browser
  // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
  preprocessors: {
    'lib/**/*.js': ['es6-module-transpiler', 'coverage'],
    'test/specs/**/*.js': ['es6-module-transpiler'],
  },

  // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
  reporters: ['progress', 'coverage'],

  coverageReporter: {
    type: 'text'
  },

  // web server port
  port: 9876,

  // enable / disable colors in the output (reporters and logs)
  colors: true,

  // level of logging
  // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
  logLevel: 'info',

  // enable / disable watching file and executing tests whenever any file changes
  autoWatch: true,

  // Start these browsers, currently available:
  // - Chrome
  // - ChromeCanary
  // - Firefox
  // - Opera (has to be installed with `npm install karma-opera-launcher`)
  // - Safari (only Mac; has to be installed with `npm install karma-safari-launcher`)
  // - PhantomJS
  // - IE (only Windows; has to be installed with `npm install karma-ie-launcher`)
  browsers: ['PhantomJS'],

  // If browser does not capture in given timeout [ms], kill it
  captureTimeout: 60000,

  // Continuous Integration mode
  // if true, it capture browsers, run tests and exit
  singleRun: false
};
