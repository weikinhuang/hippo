define(['./uri'], function(Uri) {
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

    return window.fetch(url, options);
  };
});
