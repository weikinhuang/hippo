import Uri from './uri';

function isCrossOrigin(origin, remote) {
  const remoteUri = Uri.parse(remote);
  const isSameHost = origin.host === remoteUri.host && origin.port === remoteUri.port;

  return remoteUri.isAbsolute() && !isSameHost;
}

export default function xhr(url, options = {}) {
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
