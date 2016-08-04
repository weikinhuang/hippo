import Uri from './uri';

function isCrossOrigin(origin, remote) {
  remote = Uri.parse(remote);

  return remote.isAbsolute() &&
         !(origin.host === remote.host && origin.port === remote.port);
}

export default function xhr(url, options) {
  options = options || {};

  if (url && isCrossOrigin(window.location, url)) {
    options.credentials = 'include';
  }
  else {
    options.credentials = 'same-origin';
  }
  if (options.method) {
    options.method = options.method.toUpperCase();
  }

  return window.fetch(url, options);
};
