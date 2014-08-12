/* global require */
var tests = [];

for (var file in window.__karma__.files) {
  if (window.__karma__.files.hasOwnProperty(file)) {
    if (/test\/specs\//.test(file)) {
      tests.push(file);
    }
  }
}

require({
  baseUrl: '/base',

  paths: {
    'promise': 'bower_components/es6-promise/promise',
    'reqwest': 'bower_components/reqwest/reqwest'
  }
}, tests, window.__karma__.start);

