module.exports = function(grunt) {
  grunt.initConfig({
    karma: {
      options: {
        configFile: 'karma.conf.js',
      },
      dev: {
        reporters: ['doc'],
      }
    }
  });

  grunt.loadNpmTasks('grunt-karma');
};
