define(['chai-as-promised', 'lib/client', 'lib/resource'], function(chaiAsPromised, Client, Resource) {
  var server;

  chai.use(chaiAsPromised);

  beforeEach(function() {
    server = sinon.fakeServer.create();
    server.autoRespond = true;
  });

  afterEach(function() {
    server.restore();
    server = null;
  });

  describe.only('Client', function() {
    it('can be instantiated', function() {
      expect(new Client("")).to.be.an.instanceOf(Client);
    });

    describe('#constructor', function() {
      describe('when not given an api root', function() {
        it('throws an error', function() {
          expect(function() {
            new Client();
          }).to.throw(/Client must be initialized with an API Root/);
        });
      });
    });

    describe('#walk', function() {
      describe('when given an api root', function() {
        var client = new Client('/v1/foo');

        describe('that does not conform to the hypermedia format', function() {
          var response = [200, { "Content-Type": "application/json" }, JSON.stringify({})];

          it('returns a rejected promise', function() {
            server.respondWith('OPTION', '/v1/foo', response);
            return expect(client.walk()).to.be.rejectedWith(/API does not conform to expected hypermedia format/);
          });
        });

        describe('that does conform to the hypermedia format', function() {
          var links = {
            _links: {
              self: { href: '/v1/foo' }
            }
          };
          var response = [200, { "Content-Type": "application/json" }, JSON.stringify(links)];

          it('returns a resolved promise ', function() {
            server.respondWith('OPTION', '/v1/foo', response);
            return expect(client.walk()).to.become(new Resource(links));
          });
        });
      });

      describe('when given a shortname', function() {
        var links = {
          root: {
            _links: {
              self: { href: '/v1' },
              foo: { href: '/v1/foo' }
            }
          },
          foo: {
            _links: {
              self: { href: '/v1/foo' }
            }
          }
        };
        var responses = {
          root: [200, { "Content-Type": "application/json" }, JSON.stringify(links.root)],
          foo: [200, { "Content-Type": "application/json" }, JSON.stringify(links.foo)]
        };

        it('returns a resolved promise of a resouce', function() {
          var client = new Client('/v1');

          server.respondWith('OPTION', '/v1', responses.root);
          server.respondWith('OPTION', '/v1/foo', responses.foo);

          return expect(client.walk('foo')).to.become(new Resource(links.foo));
        });

        describe('that does not exist', function() {
          it('returns a promise that rejects', function() {
            var client = new Client('/v1');

            server.respondWith('OPTION', '/v1', responses.root);
            server.respondWith('OPTION', '/v1/foo', responses.foo);

            return expect(client.walk('bar')).to.eventually.be.rejectedWith(/Unknown connection/);
          });
        });

        describe('that has already been traversed', function() {
          it('does not make duplicate requests', function() {
            var client = new Client('/v1');
            var xhrCalls = sinon.spy();

            server.respondWith('OPTION', '/v1', function(req) {
              xhrCalls();
              req.respond.apply(req, responses.root);
            });
            server.respondWith('OPTION', '/v1/foo', function(req) {
              xhrCalls();
              req.respond.apply(req, responses.foo);
            });

            return client.walk('foo')
            .then(function() {
              expect(xhrCalls).to.have.been.calledTwice;

              return client.walk('foo');
            })
            .then(function() {
              expect(xhrCalls).to.have.been.calledTwice;
            });
          });
        });

        describe('that has not already been travered', function() {
          it('traverses from the root', function() {
            var client = new Client('/v1');
            var xhrCalls = sinon.spy();

            server.respondWith('OPTION', '/v1', function(req) {
              xhrCalls();
              req.respond.apply(req, responses.root);
            });
            server.respondWith('OPTION', '/v1/foo', function(req) {
              xhrCalls();
              req.respond.apply(req, responses.foo);
            });

            return client.walk()
            .then(function() {
              expect(xhrCalls).to.have.been.calledOnce;

              return client.walk('foo');
            })
            .then(function() {
              expect(xhrCalls).to.have.been.calledTwice;
            });
          });
        });
      });
    });
  });
});
