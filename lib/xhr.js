define(['reqwest', 'promise'], function(reqwest, Promise) {
  return function xhr(options) {
    options = options || {};

    return new Promise(function(resolve, reject) {
      options.success = resolve;
      options.error = reject;

      reqwest(options);
    });
  };
});
