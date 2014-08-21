/**
 * Graph
 * - head: Head root node
 * - traversals: Map of all traversed pathes; keyed hash => uri
 * - nodes: Map of all known node; keyed uri => Node
 */
define(['reqwest', 'promise', './resource'], function(reqwest, Promise, Resource) {
  function xhr(options) {
    return new Promise(function(resolve, reject) {
      options.success = function(resp) { resolve(resp); };
      options.error = function(err) { reject(err); };

      reqwest(options);
    });
  }

  function toWalkerPath(walkerPath) {
    return walkerPath.map(function(path) {
      if (typeof path === 'object') {
        return path.name;
      }

      return path;
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

    if (!this._head) {
      return this._getRootDescriptor(this._apiRoot)
      .then(function(rootResource) {
        this._head = rootResource;

        if (!args.length) {
          return this._head;
        }

        return this._doWalk(args);
      }.bind(this));
    }

    return this._doWalk(args);
  };

  Client.prototype._doWalk = function(shortNames) {
    var self = this;
    var walkerPath = toWalkerPath(shortNames);
    var traversal = this._traversals[walkerPath];

    if (traversal) {
      return this._nodes[traversal];
    }

    return shortNames.reduce(function(chain, shortName) {
      return chain.then(function(resource) {
        return self._getDescriptor(resource.getConnection(shortName));
      });
    }, Promise.resolve(this._head))
    .then(function(resource) {
      var uri = resource.getConnection('self');
      self._traversals[walkerPath] = uri;
      self._nodes[uri] = resource;

      return resource;
    });
  };

  Client.prototype._getRootDescriptor = function(apiRoot) {
    return this._getDescriptor(apiRoot)
    .catch(function() {
      throw new Error('API does not conform to expected hypermedia format');
    });
  };

  Client.prototype._getDescriptor = function(uri) {
    return new Promise(function(resolve, reject) {
      xhr({
        url: uri,
        method: 'option',
        type: 'json'
      }).then(function(descriptor) {
        resolve(new Resource(descriptor));
      })
      .catch(function(err) {
        reject(err);
      });
    });
  };

  return Client;
});
