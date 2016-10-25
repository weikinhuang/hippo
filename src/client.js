import xhr from './xhr';
import Resource from './resource';
import merge from 'lodash.merge';

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

export default class Client {
  constructor(apiRoot, options = {}) {
    if (typeof apiRoot === 'undefined') {
      throw new Error('Client must be initialized with an API Root');
    }

    this._apiRoot = apiRoot;
    this._options = options;
    this._traversals = {};
    this._nodes = {};
  }

  walk(...shortNames) {
    return this._getRootDescriptor()
    .then((head) => this._doWalk(shortNames, head));
  }

  clearDescriptorCache() {
    delete this._descriptorCache;
  }

  _doWalk(shortNames, head) {
    var walkerPath = toWalkerPath(shortNames);
    var traversal = this._traversals[walkerPath];

    if (traversal) {
      return Promise.resolve(this._nodes[traversal]);
    }

    return shortNames.reduce((chain, shortName) => {
      return chain.then((resource) => this._getDescriptor(resource.getConnection(shortName)));
    }, Promise.resolve(head))
    .then((resource) => {
      const uri = resource.getConnection('self');
      this._traversals[walkerPath] = uri;
      this._nodes[uri] = resource;

      return resource;
    });
  }

  _getRootDescriptor() {
    return this._getDescriptor(this._apiRoot)
    .catch(() => {
      throw new Error('API does not conform to expected hypermedia format');
    });
  };

  _getDescriptor(uri) {
    if (!this._descriptorCache) {
      this._descriptorCache = {};
    }
    if (this._descriptorCache[uri]) {
      return this._descriptorCache[uri];
    }

    this._descriptorCache[uri] = xhr(uri, merge({}, this._options.walkOptions, { method: 'options' }))
    .then((res) => {
      if (!res.ok) {
        throw new Error(res.statusText);
      }
      return res.json();
    })
    .then((descriptor) => new Resource(descriptor, this._options.requestOptions))
    .catch(() => {
      delete this._descriptorCache[uri];
      throw new Error('Unable to get descriptor for uri "' + uri + '"');
    });

    return this._descriptorCache[uri];
  }
}
