/* eslint-env node */
'use strict';

var gulp = require('gulp');

var _ = require('lodash');
var karma = require('karma').server;

var commonConfig = require('./karma-common-config');

gulp.task('test', function(done) {
  var ciAdditions = {
    browsers: ['PhantomJS'],
    singleRun: true
  };

  karma.start(_.assign({}, commonConfig, ciAdditions), done);
});

gulp.task('tdd', function(done) {
  var tddAdditions = {
    reporters: ['progress', 'osx']
  };

  karma.start(_.assign({}, commonConfig, tddAdditions), done);
});

gulp.task('default', ['tdd']);
