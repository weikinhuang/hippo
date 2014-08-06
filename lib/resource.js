/**
 * Resource
 * - descriptor: descripiton of the endpoint as given by the server
 * - connections: Map of known shortnames to Resources
 */
function Resource(descriptor) {
  this._description = {};
  this._connections = {};

  this._parseDescriptor(descriptor);
  this._parseConnectionsFromDescription();
}

Resource.prototype.description = function() {
  return this._description;
};

Resource.prototype.connections = function() {
  return this._connections;
};

Resource.prototype.getConnection = function(connectionName) {
  var uri = this._connections[connectionName];

  if (!uri) {
    throw new Error('Unknown connection: ' + uri);
  }

  return uri;
};

Resource.prototype._parseDescriptor = function(descriptor) {
  if (!descriptor) {
    throw new Error('Resource constructor requires a description');
  }

  if (!descriptor._links) {
    throw new Error('Resource constructor given a malformed descriptor');
  }

  this._description = descriptor._links;
};

Resource.prototype._parseConnectionsFromDescription = function() {
  Object.keys(this._description).forEach(function(connection) {
    var connectionDescriptor = this._description[connection];

    if (!connectionDescriptor.href) {
      throw new Error('Resource received malformed resource link without "href" property: ' + connection);
    }

    this._connections[connection] = connectionDescriptor.href;
  }, this);
}

export default Resource;
