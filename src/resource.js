import UriTemplate from './uritemplate';
import xhr from './xhr';

function extend(obj) {
  var i, prop, source;
  for (i = 1; i < arguments.length; ++i) {
    source = arguments[i];
    for (prop in source) {
      obj[prop] = source[prop];
    }
  }
  return obj;
}

/**
 * Resource
 * - descriptor: descripiton of the endpoint as given by the server
 * - connections: Map of known shortnames to Resources
 */
function Resource(descriptor, options) {
  this._description = {};
  this._requestOptions = options || {};
  this._parseDescriptor(descriptor);
}

Resource.prototype.description = function() {
  return this._description;
};

Resource.prototype.getConnection = function(connectionName) {
  if (!connectionName) {
    throw new Error('No shortname given for connection');
  }

  var connection, data = {};

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
};

Resource.prototype.get = function(params, options) { return this._issueRequest('get', params, null, options); };
Resource.prototype.head = function(params, options) { return this._issueRequest('head', params, null, options); };

Resource.prototype.post = function(body, params, options) { return this._issueRequest('post', params, body, options); };
Resource.prototype.put = function(body, params, options) { return this._issueRequest('put', params, body, options); };
Resource.prototype.patch = function(body, params, options) { return this._issueRequest('patch', params, body, options); };
Resource.prototype.delete = function(body, params, options) { return this._issueRequest('delete', params, body, options); };

Resource.prototype._issueRequest = function(method, params, body, options) {
  options = options || {};

  var selfConn = this.getConnection({ name: 'self', data: params || {} });
  var requestOptions = extend({}, this._requestOptions, options, { method: method });
  requestOptions.headers = extend({}, this._requestOptions.headers || {}, options.headers || {});
  if (body) {
    requestOptions.body = body;
  }

  return xhr(selfConn, requestOptions);
};

Resource.prototype._parseDescriptor = function(descriptor) {
  if (!descriptor) {
    throw new Error('Resource constructor requires a description');
  }

  if (!descriptor._links || typeof descriptor._links !== 'object') {
    throw new Error('Resource constructor given a malformed descriptor');
  }

  Object.keys(descriptor._links).forEach(function(link) {
    var connection = descriptor._links[link];

    if (!connection.href) {
      throw new Error('Malformed connection "' + link + '"; Missing "href" property');
    }
  });

  this._description = descriptor._links;
};

export default Resource;
