/**
 * Graph
 * - head: Head root node
 * - traversals: Map of all traversed pathes; keyed hash => uri
 * - nodes: Map of all known node; keyed uri => Node
 */
define(['./xhr', './resource'], function(xhr, Resource) {
  function toWalkerPath(walkerPath) {
    return walkerPath.map(function(path) {
      if (!path) {
        throw new Error('Client walk: A shortname must be provided');
      }

      return path.name || path;
    }).join('#');
  }

  function Client(apiRoot) {
    if (typeof apiRoot === 'undefined') {
      throw new Error('Client must be initialized with an API Root');
    }

    this._apiRoot = apiRoot;
    this._traversals = {};
    this._nodes = {};
  }

  Client.prototype.walk = function() {
    var args = Array.prototype.slice.call(arguments);

    return this._getRootDescriptor()
    .then(this._doWalk.bind(this, args));
  };

  Client.prototype.clearDescriptorCache = function() {
    delete this._descriptorCache;
  };

  Client.prototype._doWalk = function(shortNames, head) {
    var self = this;
    var walkerPath = toWalkerPath(shortNames);
    var traversal = this._traversals[walkerPath];

    if (traversal) {
      return Promise.resolve(this._nodes[traversal]);
    }

    return shortNames.reduce(function(chain, shortName) {
      return chain.then(function(resource) {
        return self._getDescriptor(resource.getConnection(shortName));
      });
    }, Promise.resolve(head))
    .then(function(resource) {
      var uri = resource.getConnection('self');
      self._traversals[walkerPath] = uri;
      self._nodes[uri] = resource;

      return resource;
    });
  };

  Client.prototype._getRootDescriptor = function() {
    return this._getDescriptor(this._apiRoot)
    .catch(function() {
      throw new Error('API does not conform to expected hypermedia format');
    });
  };

  Client.prototype._getDescriptor = function(uri) {
    if ((this._descriptorCache = this._descriptorCache || {})[uri]) {
      return this._descriptorCache[uri];
    }

    var options = {
      url: uri,
      method: 'options',
      type: 'json'
    };

    this._descriptorCache[uri] = xhr(options)
    .then(function(descriptor) {
      return new Resource(descriptor);
    });

    this._descriptorCache[uri].catch(function() {
      delete this._descriptorCache[uri];
    });
    return this._descriptorCache[uri];
  };

  return Client;
});
