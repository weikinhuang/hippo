/* jshint node: true */

module.exports = function(grunt) {
  'use strict';

  grunt.initConfig({
    karma: {
      options: {
        configFile: 'karma.conf.js',
      },
      dev: {
        reporters: ['progress', 'osx'],
      },
      single: {
        reporters: ['doc'],
        singleRun: true
      },
      ci: {
        browsers: ['PhantomJS'],
        singleRun: true
      }
    }
  });

  grunt.loadNpmTasks('grunt-karma');
};
