define(['reqwest', 'promise'], function(reqwest, Promise) {
  return function xhr(options) {
    options = options || {};

    return new Promise(function(resolve, reject) {
      options.success = function(resp) { resolve(resp); };
      options.error = function(err) { reject(err); };

      reqwest(options);
    });
  };
});
