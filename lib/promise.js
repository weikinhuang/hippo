/* global process */
define(function(undef) {
  'use strict';

  function isFunction(fn) {
    return typeof fn === 'function';
  }

  function isObject(obj) {
    return typeof obj === 'object';
  }

  function defer(cb) {
    if (typeof process !== 'undefined' && process.nextTick) {
      process.nextTick(cb);
    }
    else {
      setTimeout(cb, 0);
    }
  }

  function pinkySwear() {
    var state;           // undefined/null = pending, true = fulfilled, false = rejected
    var values = [];     // an array of values as arguments for the then() handlers
    var deferred = [];   // functions to call when set() is invoked

    var set = function(newState, newValues) {
      if (state === null && newState !== null) {
        state = newState;
        values = newValues;

        if (deferred.length) {
          defer(function() {
            deferred.forEach(function(deferredFn) {
              deferredFn();
            });
          });
        }
      }

      return state;
    };

    set.then = function (onFulfilled, onRejected) {
      var next = pinkySwear(),
          callCallbacks;

      callCallbacks = function() {
          try {
            var f = state ? onFulfilled : onRejected,
                resolve;

            if (isFunction(f)) {
              resolve = function(x) {
                var cbCalled = 0;

                function doResolve(x) {
                  var then;

                  if (x && (isObject(x) || isFunction(x)) && isFunction(x.then)) {
                    then = x.then;

                    if (x === next) {
                      throw new TypeError();
                    }

                    then.call(x, function success(x) {
                      ++cbCalled;

                      if (!cbCalled) { resolve(x); }
                    }, function failure(value) {
                      ++cbCalled;

                      if (!cbCalled) { next(false, [value]); }
                    });
                  }
                  else {
                    next(true, [x]);
                  }
                }

                try { doResolve(x); }
                catch(e) {
                  ++cbCalled;

                  if (!cbCalled) {
                    next(false, [e]);
                  }
                }
              };

              resolve(f.apply(undef, values));
            }
            else {
              next(state, values);
            }
        }
        catch (e) {
          next(false, [e]);
        }
      };

      if (state !== null) {
        defer(callCallbacks);
      }
      else {
        deferred.push(callCallbacks);
      }

      return next;
    };

    // always(func) is the same as then(func, func)
    set.always = function(fn) {
      return set.then(fn, fn);
    };

    // error(func) is the same as then(0, func)
    set.error = function(fn) {
      return set.then(0, fn);
    };

    return set;
  }

  return pinkySwear;
});
