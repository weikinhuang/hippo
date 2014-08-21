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
    var connection, data = {};

    if (typeof connectionName === 'object') {
      connection = this._description[connectionName.name];
      data = connectionName.data;
    }
    else {
      connection = this._description[connectionName];
    }

    if (!connection) {
      throw new Error('Unknown connection: ' + connectionName);
    }

    return new UriTemplate(connection.href).expand(data).toString();
  };

  Resource.prototype.get = function(params) {
    params = params || {};

    var selfConn = this.getConnection({ name: 'self', data: params });

    return xhr({
      url: selfConn
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
