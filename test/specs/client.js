import Client from 'src/client';
import Resource from 'src/resource';

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
    expect(new Client("") instanceof Client).toBeTruthy();
  });

  describe('#constructor', function() {
    describe('when not given an api root', function() {
      it('throws an error', function() {
        expect(function() {
          new Client();
        }).toThrowError(/Client must be initialized with an API Root/);
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

        it('returns a rejected promise', function(done) {
          server.respondWith('OPTIONS', '/v1/foo', response);
          client.walk()
          .catch((e) => {
            expect(e.message).toMatch(/API does not conform to expected hypermedia format/);
          })
          .then(done, done.fail);
        });
      });

      describe('that does conform to the hypermedia format', function() {
        var links = {
          _links: {
            self: { href: '/v1/foo' }
          }
        };
        var response = [200, { "Content-Type": "application/json" }, JSON.stringify(links)];

        it('returns a resolved promise ', function(done) {
          server.respondWith('OPTIONS', '/v1/foo', response);
          client.walk()
          .then((res) => {
            expect(res).toEqual(new Resource(links));
          })
          .then(done, done.fail);
        });

        it('passes walk options to the walk request', function(done) {
          var options = { walkOptions: { headers: { foo: 'hello' } } };
          var client = new Client('/v1/foo', options);

          server.respondWith('OPTIONS', '/v1/foo', function(req) {
            expect(req.requestHeaders.foo).toEqual('hello');
            req.respond.apply(req, response);
            done();
          });

          client.walk();
        });

        it('passes request options to created resources', function(done) {
          var options = { requestOptions: { headers: { foo: 'hello' } } };
          var client = new Client('/v1/foo', options);

          server.respondWith('OPTIONS', '/v1/foo', response);
          client.walk()
          .then((res) => {
            expect(res).toEqual(new Resource(links, options.requestOptions));
          })
          .then(done, done.fail);
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
        it('returns a rejected promise', function(done) {
          var client = new Client('/v1');
          server.respondWith('OPTIONS', '/v1', responses.root);
          client.walk('')
          .catch((e) => {
            expect(e.message).toMatch(/Client walk: A shortname must be provided/);
          })
          .then(done, done.fail);
        });
      });

      it('returns a resolved promise of a resouce', function(done) {
        var client = new Client('/v1');

        server.respondWith('OPTIONS', '/v1', responses.root);
        server.respondWith('OPTIONS', '/v1/foo', responses.foo);

        client.walk('foo')
        .then((res) => {
          expect(res).toEqual(new Resource(links.foo));
        })
        .then(done, done.fail);
      });

      describe('that does not exist', function() {
        it('returns a promise that rejects', function(done) {
          var client = new Client('/v1');

          server.respondWith('OPTIONS', '/v1', responses.root);
          server.respondWith('OPTIONS', '/v1/foo', responses.foo);

          client.walk('bar')
          .catch((e) => {
            expect(e.message).toMatch(/Unknown connectio/);
          })
          .then(done, done.fail);
        });
      });

      describe('that has not already been traversed', function() {
        it('traverses from the root', function(done) {
          var client = new Client('/v1');
          var xhrCalls = jasmine.createSpy('xhr');

          server.respondWith('OPTIONS', '/v1', function(req) {
            xhrCalls();
            req.respond.apply(req, responses.root);
          });
          server.respondWith('OPTIONS', '/v1/foo', function(req) {
            xhrCalls();
            req.respond.apply(req, responses.foo);
          });

          client.walk()
          .then(function() {
            expect(xhrCalls.calls.count()).toEqual(1);
            return client.walk('foo');
          })
          .then(function() {
            expect(xhrCalls.calls.count()).toEqual(2);
          })
          .then(done, done.fail);
        });
      });

      describe('that has already been traversed', function() {
        it('does not make duplicate requests', function(done) {
          var client = new Client('/v1');
          var xhrCalls = jasmine.createSpy('xhr');

          server.respondWith('OPTIONS', '/v1', function(req) {
            xhrCalls();
            req.respond.apply(req, responses.root);
          });
          server.respondWith('OPTIONS', '/v1/foo', function(req) {
            xhrCalls();
            req.respond.apply(req, responses.foo);
          });

          client.walk('foo')
          .then(function() {
            expect(xhrCalls.calls.count()).toEqual(2);
            return client.walk('foo');
          })
          .then(function() {
            expect(xhrCalls.calls.count()).toEqual(2);
          })
          .then(done, done.fail);
        });
      });

      it('returns a resolved promise', function(done) {
        var client = new Client('/v1');
        var node = new Resource(links.foo);

        server.respondWith('OPTIONS', '/v1', responses.root);
        server.respondWith('OPTIONS', '/v1/foo', responses.foo);

        client.walk('foo')
        .then(function(resource) {
          expect(resource).toEqual(node);
        })
        .then(() => {
          return client.walk('foo');
        })
        .then(function(resource) {
          expect(resource).toEqual(node);
        })
        .then(done, done.fail);
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

      it('uses the object to template out the uri', function(done) {
        var client = new Client('/v1');
        var uri;

        server.respondWith('OPTIONS', '/v1', responses.root);
        server.respondWith('OPTIONS', /\/v1\/temp/, function(req) {
          uri = req.url;
          req.respond.apply(req, responses.templated);
        });

        client.walk({ name: 'templated', data: { var: 5 } })
        .then(function() {
          expect(uri).toEqual('/v1/temp?var=5');
        })
        .then(done, done.fail);
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

      it('returns a resource for the resulting traversal', function(done) {
        var client = new Client('/v1');

        server.respondWith('OPTIONS', '/v1', responses.root);
        server.respondWith('OPTIONS', '/v1/foo', responses.foo);
        server.respondWith('OPTIONS', /\/v1\/temp/, responses.templated);

        client.walk('foo', { name: 'templated', data: { var: 'hello' } })
        .then((res) => {
          expect(res).toEqual(new Resource(links.templated));
        })
        .then(done, done.fail);
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

      it('returns an "Unable to get descriptor" error', function(done) {
        var client = new Client('/v1');

        server.respondWith('OPTIONS', '/v1', responses.root);
        server.respondWith('OPTIONS', '/v1/foo', responses.foo);

        client.walk('foo')
        .catch((e) => {
          expect(e.message).toMatch(new RegExp('Unable to get descriptor for uri "/v1/foo"'));
        })
        .then(done, done.fail);
      });
    });
  });
});
