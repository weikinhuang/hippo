define(['./uritemplate', './xhr'], function(UriTemplate, xhr) {
  /**
   * Resource
   * - descriptor: descripiton of the endpoint as given by the server
   * - connections: Map of known shortnames to Resources
   */
  function Resource(descriptor) {
    this._description = {};
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

  Resource.prototype.get = function(params) { return this._issueRequest('get', params); };
  Resource.prototype.delete = function(params) { return this._issueRequest('delete', params); };
  Resource.prototype.head = function(params) { return this._issueRequest('head', params); };

  Resource.prototype.post = function(data, params) { return this._issueRequest('post', params, data); };
  Resource.prototype.put = function(data, params) { return this._issueRequest('put', params, data); };
  Resource.prototype.patch = function(data, params) { return this._issueRequest('patch', params, data); };

  Resource.prototype._issueRequest = function(method, params, data) {
    params = params || {};
    data = data || {};

    var selfConn = this.getConnection({ name: 'self', data: params });

    return xhr({
      url: selfConn,
      method: method,
      data: data
    });
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

  return Resource;
});
