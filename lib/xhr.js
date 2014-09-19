define(['reqwest', 'promise', './uri'], function(reqwest, Promise, Uri) {
  function isCrossOrigin(origin, remote) {
    remote = Uri.parse(remote);

    return remote.isAbsolute() &&
           !(origin.host === remote.host && origin.port === remote.port);
  }

  return function xhr(options) {
    options = options || {};

    if (options.url && isCrossOrigin(window.location, options.url)) {
      options.crossOrigin = true;
      options.withCredentials = true;
    }

    return new Promise(function(resolve, reject) {
      options.success = resolve;
      options.error = reject;

      reqwest(options);
    });
  };
});
