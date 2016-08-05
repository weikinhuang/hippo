import xhr from './xhr';
import Resource from './resource';

/**
 * Graph
 * - head: Head root node
 * - traversals: Map of all traversed pathes; keyed hash => uri
 * - nodes: Map of all known node; keyed uri => Node
 */
function toWalkerPath(walkerPath) {
  return walkerPath.map(function(path) {
    if (!path) {
      throw new Error('Client walk: A shortname must be provided');
    }

    return path.name || path;
  }).join('#');
}

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

export default class Client {
  constructor(apiRoot, options) {
    if (typeof apiRoot === 'undefined') {
      throw new Error('Client must be initialized with an API Root');
    }

    this._apiRoot = apiRoot;
    this._options = options || {};
    this._traversals = {};
    this._nodes = {};
  }

  walk() {
    var args = Array.prototype.slice.call(arguments);

    return this._getRootDescriptor()
    .then(this._doWalk.bind(this, args));
  }


  clearDescriptorCache() {
    delete this._descriptorCache;
  }

  _doWalk(shortNames, head) {
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
  }

  _getRootDescriptor() {
    return this._getDescriptor(this._apiRoot)
    .catch(function() {
      throw new Error('API does not conform to expected hypermedia format');
    });
  };

  _getDescriptor(uri) {
    if ((this._descriptorCache = this._descriptorCache || {})[uri]) {
      return this._descriptorCache[uri];
    }

    this._descriptorCache[uri] = xhr(uri, extend({}, this._options.walkOptions, { method: 'options' }))
    .then(function(res) {
      if (res.status < 200 || res.status >= 300) {
        throw new Error(res.statusText);
      }
      return res.json();
    })
    .then(function(descriptor) {
      return new Resource(descriptor, this._options.requestOptions);
    }.bind(this))
    .catch(function() {
      delete this._descriptorCache[uri];
      throw new Error('Unable to get descriptor for uri "' + uri + '"');
    }.bind(this));

    return this._descriptorCache[uri];
  }
}
