import chaiAsPromised from 'chai-as-promised';
import Client from 'src/client';
import Resource from 'src/resource';

  chai.use(chaiAsPromised);

  describe('Client', function() {
    var server;

    beforeEach(function() {
      server = sinon.fakeServer.create();
      server.autoRespond = true;
    });

    afterEach(function() {
      server.restore();
      server = null;
    });

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

        afterEach(function() {
          client.clearDescriptorCache();
        });

        describe('that does not conform to the hypermedia format', function() {
          var response = [200, { "Content-Type": "application/json" }, JSON.stringify({})];

          it('returns a rejected promise', function() {
            server.respondWith('OPTIONS', '/v1/foo', response);
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
            server.respondWith('OPTIONS', '/v1/foo', response);
            return expect(client.walk()).to.become(new Resource(links));
          });

          it('passes walk options to the walk request', function() {
            var options = { walkOptions: { headers: { foo: 'hello' } } };
            var client = new Client('/v1/foo', options);

            server.respondWith('OPTIONS', '/v1/foo', function(req) {
              expect(req.requestHeaders.foo).to.eql('hello');
              req.respond.apply(req, response);
            });

            return client.walk();
          });

          it('passes request options to created resources', function() {
            var options = { requestOptions: { headers: { foo: 'hello' } } };
            var client = new Client('/v1/foo', options);

            server.respondWith('OPTIONS', '/v1/foo', response);
            return expect(client.walk()).to.become(new Resource(links, options.requestOptions));
          });
        });
      });

      describe('when given a shortname', function() {
        var links = {
          root: {
            _links: {
              self: { href: '/v1' },
              foo: { href: '/v1/foo' },
              templated: { href: '/v1/temp{?var}' }
            }
          },
          foo: {
            _links: {
              self: { href: '/v1/foo' }
            }
          },
        };
        var responses = {
          root: [200, { "Content-Type": "application/json" }, JSON.stringify(links.root)],
          foo: [200, { "Content-Type": "application/json" }, JSON.stringify(links.foo)]
        };

        describe('that is falsey', function() {
          it('returns a rejected promise', function() {
            var client = new Client('/v1');
            server.respondWith('OPTIONS', '/v1', responses.root);
            return expect(client.walk('')).to.eventually.be.rejectedWith(/Client walk: A shortname must be provided/);
          });
        });

        it('returns a resolved promise of a resouce', function() {
          var client = new Client('/v1');

          server.respondWith('OPTIONS', '/v1', responses.root);
          server.respondWith('OPTIONS', '/v1/foo', responses.foo);

          return expect(client.walk('foo')).to.become(new Resource(links.foo));
        });

        describe('that does not exist', function() {
          it('returns a promise that rejects', function() {
            var client = new Client('/v1');

            server.respondWith('OPTIONS', '/v1', responses.root);
            server.respondWith('OPTIONS', '/v1/foo', responses.foo);

            return expect(client.walk('bar')).to.eventually.be.rejectedWith(/Unknown connection/);
          });
        });

        describe('that has not already been traversed', function() {
          it('traverses from the root', function() {
            var client = new Client('/v1');
            var xhrCalls = sinon.spy();

            server.respondWith('OPTIONS', '/v1', function(req) {
              xhrCalls();
              req.respond.apply(req, responses.root);
            });
            server.respondWith('OPTIONS', '/v1/foo', function(req) {
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

        describe('that has already been traversed', function() {
          it('does not make duplicate requests', function() {
            var client = new Client('/v1');
            var xhrCalls = sinon.spy();

            server.respondWith('OPTIONS', '/v1', function(req) {
              xhrCalls();
              req.respond.apply(req, responses.root);
            });
            server.respondWith('OPTIONS', '/v1/foo', function(req) {
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

        it('returns a resolved promise', function() {
          var client = new Client('/v1');
          var node = new Resource(links.foo);

          server.respondWith('OPTIONS', '/v1', responses.root);
          server.respondWith('OPTIONS', '/v1/foo', responses.foo);

          return client.walk('foo')
          .then(function(resource) {
            expect(resource).to.deep.equal(node);

            return client.walk('foo')
            .then(function(resource) {
              expect(resource).to.deep.equal(node);
            });
          });
        });
      });

      describe('when given a shortname object', function() {
        var links = {
          root: {
            _links: {
              self: { href: '/v1' },
              templated: { href: '/v1/temp{?var}' }
            }
          },
          templated: {
            _links: {
              self: { href: '/v1/temp{?var}' }
            }
          }
        };
        var responses = {
          root: [200, { "Content-Type": "application/json" }, JSON.stringify(links.root)],
          templated: [200, { "Content-Type": "application/json" }, JSON.stringify(links.templated)]
        };

        it('uses the object to template out the uri', function() {
          var client = new Client('/v1');
          var uri;

          server.respondWith('OPTIONS', '/v1', responses.root);
          server.respondWith('OPTIONS', /\/v1\/temp/, function(req) {
            uri = req.url;
            req.respond.apply(req, responses.templated);
          });

          return client.walk({ name: 'templated', data: { var: 5 } })
          .then(function() {
            expect(uri).to.equal('/v1/temp?var=5');
          });
        });
      });

      describe('when given a combination of shortnames and shortname objects', function() {
        var links = {
          root: {
            _links: {
              self: { href: '/v1' },
              foo: { href: '/v1/foo{?user}' }
            }
          },
          foo: {
            _links: {
              self: { href: '/v1/foo{?user}' },
              templated: { href: '/v1/temp{?var}' }
            }
          },
          templated: {
            _links: {
              self: { href: '/v1/temp{?var}' }
            }
          }
        };
        var responses = {
          root: [200, { "Content-Type": "application/json" }, JSON.stringify(links.root)],
          foo: [200, { "Content-Type": "application/json" }, JSON.stringify(links.foo)],
          templated: [200, { "Content-Type": "application/json" }, JSON.stringify(links.templated)]
        };

        it('returns a resource for the resulting traversal', function() {
          var client = new Client('/v1');

          server.respondWith('OPTIONS', '/v1', responses.root);
          server.respondWith('OPTIONS', '/v1/foo', responses.foo);
          server.respondWith('OPTIONS', /\/v1\/temp/, responses.templated);

          return expect(client.walk('foo', { name: 'templated', data: { var: 'hello' } })).to.become(new Resource(links.templated));
        });
      });

      describe('when a shortname walk 404s', function() {
        var links = {
          root: {
            _links: {
              self: { href: '/v1' },
              foo: { href: '/v1/foo{?user}' }
            }
          },
          foo: {
            _links: {
              self: { href: '/v1/foo{?user}' }
            }
          }
        };
        var responses = {
          root: [200, { "Content-Type": "application/json" }, JSON.stringify(links.root)],
          foo: [404, { "Content-Type": "text/plain" }, ''],
        };

        it('returns an "Unable to get descriptor" error', function() {
          var client = new Client('/v1');

          server.respondWith('OPTIONS', '/v1', responses.root);
          server.respondWith('OPTIONS', '/v1/foo', responses.foo);

          return expect(client.walk('foo')).to.be.rejectedWith(new RegExp('Unable to get descriptor for uri "/v1/foo"'));
        });
      });
    });
  });
