/**
 * Graph
 * - head: Head root node
 * - traversals: Map of all traversed pathes; keyed hash => uri
 * - nodes: Map of all known node; keyed uri => Node
 */
define(['reqwest', 'promise', './resource'], function(reqwest, Promise, Resource) {
  function xhr(options) {
    return new Promise(function(resolve, reject) {
      options.success = function(resp) { resolve(resp); }
      options.error = function(err) { reject(err); }

      reqwest(options);
    });
  }

  function Client(apiRoot) {
    if (typeof apiRoot === 'undefined') {
      throw new Error('Client must be initialized with an API Root');
    }

    this._apiRoot = apiRoot;
  }

  Client.prototype.walk = function() {
    if (!this._head) {
      return this._getRootDescriptor(this._apiRoot);
    }
  };

  Client.prototype._getRootDescriptor = function(apiRoot) {
    return new Promise(function(resolve, reject) {
      xhr({
        url: apiRoot,
        method: 'option',
        type: 'json'
      }).then(function(descriptor) {
        resolve(new Resource(descriptor));
      }).catch(function(err) {
        reject("API does not conform to expected hypermedia format");
      });
    });
  };

  return Client;
});
