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

    this._options = options;

    if (typeof apiRoot === 'object') {
      this._backfillTraversals(apiRoot);
    }
    else {
      this._apiRoot = apiRoot;
      this._traversals = {};
      this._nodes = {};
    }
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
    if (this._nodes[this._apiRoot]) {
      return Promise.resolve(this._nodes[this._apiRoot]);
    }

    return this._getDescriptor(this._apiRoot)
    .catch(() => {
      throw new Error('API does not conform to expected hypermedia format');
    });
  }

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

  _backfillTraversals(shortnameMap) {
    this._apiRoot = shortnameMap.self;
    this._traversals = {};
    this._nodes = {};

    Object.entries(shortnameMap)
      .forEach(([shortname, uri]) => {
        let traversalUri;
        let descriptor;

        if (typeof uri === 'string') {
          traversalUri = uri;
          descriptor = {
            self: {
              href: uri,
            },
          };
        }
        else {
          traversalUri = uri.self.href;
          descriptor = uri;
        }

        this._traversals[shortname] = traversalUri;
        this._nodes[traversalUri] = new Resource({ _links: descriptor }, this._options.requestOptions);
      });
  }
}
