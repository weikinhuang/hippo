/* global require */
// Unbreak PhantomJS's Function.prototype.bind
var isFunction = function(o) {
  return typeof o == 'function';
};

var bind,
  slice = [].slice,
  proto = Function.prototype,
  featureMap;

featureMap = {
  'function-bind': 'bind'
};

function has(feature) {
  var prop = featureMap[feature];
  return isFunction(proto[prop]);
}

// check for missing features
if (!has('function-bind')) {
  // adapted from Mozilla Developer Network example at
  // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
  bind = function bind(obj) {
    var args = slice.call(arguments, 1),
        self = this,
        nop = function() {},
        bound = function() {
          return self.apply(this instanceof nop ? this : (obj || {}), args.concat(slice.call(arguments)));
        };
    nop.prototype = this.prototype || {}; // Firefox cries sometimes if prototype is undefined
    bound.prototype = new nop();
    return bound;
  };
  proto.bind = bind;
}

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
    promise: 'bower_components/es6-promise/promise',
    reqwest: 'bower_components/reqwest/reqwest',
    'chai-as-promised': 'node_modules/chai-as-promised/lib/chai-as-promised'
  },

  shim: {
    promise: {
      exports: 'Promise'
    }
  }
}, tests, window.__karma__.start);
