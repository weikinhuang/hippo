/* jshint node: true */
'use strict';

var gulp = require('gulp');
var moduleTranspiler = require('gulp-es6-module-transpiler');

var path = require('path');
var _ = require('lodash');
var karma = require('karma').server;

var commonConfig = require('./karma-common-config');

var jsPath = 'lib/**/*.js';
var destinationPath = 'dist';

gulp.task('amd-build', function() {
  gulp.src(jsPath)
  .pipe(moduleTranspiler({
    type: 'amd',
    compatFix: true
  }))
  .pipe(gulp.dest(path.join(destinationPath, 'amd')));
});

gulp.task('test', function(done) {
  var ciAdditions = {
    browsers: ['PhantomJS'],
    singleRun: true
  };

  karma.start(_.assign({}, commonConfig, ciAdditions), done);
});

gulp.task('tdd', function(done) {
  var tddAdditions = {
    reporters: ['progress', 'osx'],
  };

  karma.start(_.assign({}, commonConfig, tddAdditions), done);
});

gulp.task('default', ['tdd']);
