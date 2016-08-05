import UriTemplate from './uritemplate';
import xhr from './xhr';
import merge from 'lodash.merge';

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
  }

  description() {
    return this._description;
  }

  getConnection(connectionName) {
    if (!connectionName) {
      throw new Error('No shortname given for connection');
    }

    let connection;
    let data = {};

    if (typeof connectionName === 'object') {
      connection = this._description[connectionName.name] || null;
      data = connectionName.data || {};
    }
    else {
      connection = this._description[connectionName];
    }

    if (!connection) {
      throw new Error('Unknown connection: ' + connectionName);
    }

    return new UriTemplate(connection.href).expand(data).toString();
  }

  get(params, options) { return this._issueRequest('get', params, null, options); }
  head(params, options) { return this._issueRequest('head', params, null, options); }

  post(body, params, options) { return this._issueRequest('post', params, body, options); }
  put(body, params, options) { return this._issueRequest('put', params, body, options); }
  patch(body, params, options) { return this._issueRequest('patch', params, body, options); }
  delete(body, params, options) { return this._issueRequest('delete', params, body, options); }

  _issueRequest(method, params, body, options = {}) {
    var selfConn = this.getConnection({ name: 'self', data: params || {} });
    var requestOptions = merge({}, this._requestOptions, options, { method });
    if (body && !requestOptions.body) {
      requestOptions.body = body;
    }

    return xhr(selfConn, requestOptions);
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
}
