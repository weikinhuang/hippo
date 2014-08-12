define([], function() {
  /**
   * Graph
   * - head: Head root node
   * - traversals: Map of all traversed pathes; keyed hash => uri
   * - nodes: Map of all known node; keyed uri => Node
   */
  function Graph() {
    this._head = null;
    this._traversals = {};
    this._nodes = {};
  }

  return Graph;
});
