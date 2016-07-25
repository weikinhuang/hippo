define(['reqwest', 'promise', './uri'], function(reqwest, Promise, Uri) {
  function isCrossOrigin(origin, remote) {
    remote = Uri.parse(remote);

    return remote.isAbsolute() &&
           !(origin.host === remote.host && origin.port === remote.port);
  }

  return function xhr(url, options) {
    options = options || {};

    if (url && isCrossOrigin(window.location, url)) {
      options.credentials = 'include';
    }
    else {
      options.credentials = 'same-origin';
    }

    if (options.method === 'options') {
      return window.fetch(url, options);
    }

    options.url = url;
    if (options.url && isCrossOrigin(window.location, options.url)) {
      options.crossOrigin = true;
    }

    return new Promise(function(resolve, reject) {
      options.success = resolve;
      options.error = reject;

      reqwest(options);
    });
  };
});
