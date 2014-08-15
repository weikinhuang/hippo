define([], function() {
  function Graph() {
    this._head = null;
    this._traversals = {};
    this._nodes = {};
  }

  return Graph;
});
