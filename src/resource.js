import UriTemplate from './uritemplate';
import xhr from './xhr';
import merge from 'lodash.merge';
import qs from 'qs';

const NO_CACHE_REGEX = /\b(?:no-cache|no-store)\b/;
const MIME_TYPE_JSON = 'application/json';
const MIME_TYPE_WWW_FORM_URL_ENCODED = 'application/x-www-form-urlencoded';
const MIME_TYPE_FORM_DATA = 'multipart/form-data';
const QS_FORMAT_OPTIONS = { arrayFormat: 'brackets' };

/**
 * @param {Headers} requestHeaders
 * @param {Headers} responseHeaders
 */
function muxCacheHeaders(requestHeaders, responseHeaders) {
  // Using headers from: https://github.com/jshttp/fresh/blob/master/index.js
  if (responseHeaders.has('Last-Modified')) {
    requestHeaders.set('If-Modified-Since', responseHeaders.get('Last-Modified'));
  }
  if (responseHeaders.has('Etag')) {
    requestHeaders.set('If-None-Match', responseHeaders.get('Etag'));
  }
}

/**
 * @param {Response} response
 * @return {Boolean}
 */
function isCacheable(response) {
  if (!response.ok) {
    return false;
  }
  if (response.headers.has('Cache-Control') && NO_CACHE_REGEX.test(response.headers.get('Cache-Control'))) {
    return false;
  }
  return response.headers.has('Last-Modified') || response.headers.has('Etag');
}

/**
 * Resource
 * - descriptor: descripiton of the endpoint as given by the server
 * - connections: Map of known shortnames to Resources
 */
export default class Resource {
  constructor(descriptor, options = {}) {
    this._description = {};
    this._requestOptions = options;
    this._parseDescriptor(descriptor);
    this._requestCache = new Map();
  }

  description() {
    return this._description;
  }

  getConnection(connectionName) {
    const connection = this._getConnection(connectionName);

    let data = {};
    if (typeof connectionName === 'object') {
      data = connectionName.data || {};
    }

    return new UriTemplate(connection.href).expand(data).toString();
  }

  getAccept(connectionName) {
    let accept = this._getConnection(connectionName).accept;
    if (!accept) {
      return [MIME_TYPE_WWW_FORM_URL_ENCODED];
    }
    if (!Array.isArray(accept)) {
      accept = [accept];
    }
    return accept;
  }

  _getConnection(connectionName) {
    if (!connectionName) {
      throw new Error('No shortname given for connection');
    }

    let connection;
    if (typeof connectionName === 'object') {
      connection = this._description[connectionName.name] || null;
    }
    else {
      connection = this._description[connectionName];
    }

    if (!connection) {
      throw new Error('Unknown connection: ' + connectionName);
    }

    return connection;
  }

  _constructRequestOptions(method, params, body, options = {}) {
    const selfConn = this.getConnection({ name: 'self', data: params || {} });
    const requestOptions = merge({}, this._requestOptions, options, { method });
    requestOptions.headers = new Headers(requestOptions.headers || {});
    if (body && !requestOptions.body) {
      requestOptions.body = this._processBody(body, requestOptions);
    }
    return {
      url: selfConn,
      requestOptions
    };
  }

  _processBody(body, requestOtions) {
    if (typeof body === 'string') {
      return body;
    }
    if (body instanceof FormData) {
      requestOtions.headers.set('Content-Type', MIME_TYPE_FORM_DATA);
      return body;
    }

    const accept = this.getAccept({ name: 'self' });

    if (accept.includes(MIME_TYPE_JSON)) {
      requestOtions.headers.set('Content-Type', MIME_TYPE_JSON);
      return JSON.stringify(body);
    }
    if (accept.includes(MIME_TYPE_WWW_FORM_URL_ENCODED)) {
      requestOtions.headers.set('Content-Type', MIME_TYPE_WWW_FORM_URL_ENCODED);
      return qs.stringify(body, QS_FORMAT_OPTIONS);
    }
    throw new Error('Unknown request body encoding.');
  }

  get(params, options = {}) {
    const { url, requestOptions } = this._constructRequestOptions('get', params, null, options);
    // set cache headers
    if (!NO_CACHE_REGEX.test(requestOptions.cache || '') && this._requestCache.has(url)) {
      muxCacheHeaders(requestOptions.headers, this._requestCache.get(url).headers);
    }
    return xhr(url, requestOptions)
    .then((res) => {
      if (res.status === 304 && this._requestCache.has(url)) {
        return this._requestCache.get(url).clone();
      }
      if (isCacheable(res)) {
        this._requestCache.set(url, res.clone());
      }
      return res;
    });
  }

  head(params, options) { return this._issueRequest('head', params, null, options); }

  post(body, params, options) { return this._issueRequest('post', params, body, options); }
  put(body, params, options) { return this._issueRequest('put', params, body, options); }
  patch(body, params, options) { return this._issueRequest('patch', params, body, options); }
  delete(body, params, options) { return this._issueRequest('delete', params, body, options); }

  _issueRequest(method, params, body, options = {}) {
    const { url, requestOptions } = this._constructRequestOptions(method, params, body, options);
    return xhr(url, requestOptions);
  }

  _parseDescriptor(descriptor) {
    if (!descriptor) {
      throw new Error('Resource constructor requires a description');
    }

    if (!descriptor._links || typeof descriptor._links !== 'object') {
      throw new Error('Resource constructor given a malformed descriptor');
    }

    Object.keys(descriptor._links).forEach(function(link) {
      const connection = descriptor._links[link];

      if (!connection.href) {
        throw new Error('Malformed connection "' + link + '"; Missing "href" property');
      }
    });

    this._description = descriptor._links;
  }

  clearCache() {
    this._requestCache.clear();
  }
}
