define(['reqwest', 'promise'], function(reqwest) {
  console.log(reqwest);

  function Client(apiRoot) {
    if (typeof apiRoot === 'undefined') {
      throw new Error('Client must be initialized with an API Root');
    }

    this._apiRoot = apiRoot;
  }

  Client.prototype.walk = function() {
  };

  return Client;
});
