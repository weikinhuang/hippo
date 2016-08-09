import Resource from 'src/resource';

describe('Resource', function() {
  it('is a constructor', function() {
    expect(new Resource({ _links: {} }) instanceof Resource).toBeTruthy();
  });

  describe('constructor', function() {
    describe('when not given a descriptor', function() {
      it('throws an error', function() {
        expect(function() {
          new Resource();
        }).toThrowError(/Resource constructor requires a description/);
      });
    });

    describe('when given an ill formed descriptor', function() {
      it('throws an error', function() {
        expect(function() {
          new Resource({ lol: 'bad data' });
        }).toThrowError(/Resource constructor given a malformed descriptor/);
      });
    });

    describe('when given a descriptor with an ill formed link', function() {
      it('throws an error', function() {
        var descriptor = {
          _links: {
            bad: {}
          }
        };
        expect(function() {
          new Resource(descriptor);
        }).toThrowError(/Malformed connection/);
      });
    });
  });

  describe('#description', function() {
    it ('returns the description object', function() {
      var descriptor = {
        _links: {
          self: {
            href: '/'
          },
          foo: {
            href: '/foo{?bar}'
          }
        }
      };
      var resource = new Resource(descriptor);

      expect(resource.description()).toEqual(descriptor._links);
    });
  });

  describe('#getConnection', function() {
    var descriptor = {
      _links: {
        self: {
          href: '/'
        },
        foo: {
          href: '/foo{?bar}'
        }
      }
    };
    var resource = new Resource(descriptor);

    describe('when given a resource that is falsey', function() {
      it('throws an error', function() {
        expect(function() {
          resource.getConnection('');
        }).toThrowError(/No shortname given for connection/);
      });
    });

    describe('when given a shortname that is not known', function() {
      it('throws an error', function() {
        expect(function() {
          resource.getConnection('bar');
        }).toThrowError(/Unknown connection/);
      });
    });

    describe('when given a shortname that is known', function() {
      it('returns the href for that connection', function() {
        expect(resource.getConnection('self')).toEqual('/');
        expect(resource.getConnection('foo')).toEqual('/foo');
      });
    });

    describe('when given a shortname that is an object', function() {
      it('returns the href for that connection templated out', function() {
        var connection = {
          name: 'foo',
          data: {
            bar: 5
          }
        };

        expect(resource.getConnection(connection)).toEqual('/foo?bar=5');
      });
    });
  });

  describe('resource loader methods', function() {
    var server;

    beforeEach(function() {
      server = sinon.fakeServer.create();
      server.autoRespond = true;
    });

    afterEach(function() {
      server.restore();
      server = null;
    });

    describe('#get', function() {
      var descriptor = {
        _links: {
          self: {
            href: '/v1/foo{?bar}'
          }
        }
      };
      var result = {
        hello: 'world'
      };

      var responses = {
        foo: [200, { 'Content-Type': 'application/json' }, JSON.stringify(result)],
      };

      it('returns the result of sending a GET request to the resource', function(done) {
        var resource = new Resource(descriptor);
        server.respondWith('GET', '/v1/foo', responses.foo);
        resource.get()
        .then((res) => res.json())
        .then((res) => {
          expect(res).toEqual(result);
        })
        .then(done, done.fail);
      });

      describe('when given a params object', function() {
        it('return the result of sending a GET request to the templated resource', function(done) {
          var resource = new Resource(descriptor);
          server.respondWith('GET', '/v1/foo?bar=10', responses.foo);
          resource.get({ bar: 10 })
          .then((res) => res.json())
          .then((res) => {
            expect(res).toEqual(result);
          })
          .then(done, done.fail);
        });
      });

      describe('when given resource level options', function() {
        it('passes those options to the ajax request method', function(done) {
          var resource = new Resource(descriptor, { headers: { foo: 'bar' } });

          server.respondWith('GET', '/v1/foo?bar=10', function(req) {
            expect(req.requestHeaders.foo).toEqual('bar');
            req.respond(200, { 'Content-Type': 'text/plain' }, '');
            done();
          });

          resource.get({ bar: 10 });
        });
      });

      describe('when given request level options', function() {
        it('passes those options to the ajax request method', function(done) {
          var resource = new Resource(descriptor);

          server.respondWith('GET', '/v1/foo?bar=10', function(req) {
            expect(req.requestHeaders.foo).toEqual('bar');
            req.respond(200, { 'Content-Type': 'text/plain' }, '');
            done();
          });

          resource.get({ bar: 10 }, { headers: { foo: 'bar' } });
        });
      });

      describe('when given resource and request level options', function() {
        it('passes those options to the ajax request method', function(done) {
          var resource = new Resource(descriptor, { headers: { foo: 'bar' } });

          server.respondWith('GET', '/v1/foo?bar=10', function(req) {
            expect(req.requestHeaders.foo).toEqual('baz');
            req.respond(200, { 'Content-Type': 'text/plain' }, '');
            done();
          });

          resource.get({ bar: 10 }, { headers: { foo: 'baz' } });
        });
      });

      describe('when given resource and request level headers', function() {
        it('merges those options to the ajax request method', function(done) {
          var resource = new Resource(descriptor, { headers: { foo: 'bar' } });

          server.respondWith('GET', '/v1/foo?bar=10', function(req) {
            expect(req.requestHeaders.foo).toEqual('bar');
            expect(req.requestHeaders.other).toEqual('str');
            req.respond(200, { 'Content-Type': 'text/plain' }, '');
            done();
          });

          resource.get({ bar: 10 }, { headers: { other: 'str' } });
        });

        it('overwrites those options to the ajax request method', function(done) {
          var resource = new Resource(descriptor, { headers: { foo: 'bar' } });

          server.respondWith('GET', '/v1/foo?bar=10', function(req) {
            expect(req.requestHeaders.foo).toEqual('baz');
            req.respond(200, { 'Content-Type': 'text/plain' }, '');
            done();
          });

          resource.get({ bar: 10 }, { headers: { foo: 'baz' } });
        });
      });

      describe('when server responds with cache headers', function() {
        it('caches subsequent cache-able requests with last-modified', function(done) {
          var resource = new Resource(descriptor);
          let counter = 0;

          server.respondWith('GET', '/v1/foo?bar=10', function(req) {
            counter++;
            if (!req.requestHeaders['if-modified-since']) {
              expect(counter).toEqual(1);
              req.respond(200, {
                'Content-Type': 'application/json',
                'Last-Modified': 'Tue, 09 Aug 2016 14:23:49 GMT'
              }, JSON.stringify(result));
              return;
            }
            expect(counter).toBeGreaterThan(1);
            expect(req.requestHeaders['if-modified-since']).toEqual('Tue, 09 Aug 2016 14:23:49 GMT');
            req.respond(304, {}, '');
          });

          resource.get({ bar: 10 })
          .then((res) => res.json())
          .then((data) => {
            expect(data.hello).toEqual('world');
            return resource.get({ bar: 10 });
          })
          .then((res) => res.json())
          .then((data) => {
            expect(data.hello).toEqual('world');
          })
          .then(done, done.fail);
        });

        it('caches subsequent cache-able requests with etag', function(done) {
          var resource = new Resource(descriptor);
          let counter = 0;

          server.respondWith('GET', '/v1/foo?bar=10', function(req) {
            counter++;
            if (!req.requestHeaders['if-none-match']) {
              expect(counter).toEqual(1);
              req.respond(200, {
                'Content-Type': 'application/json',
                Etag: 'foobar'
              }, JSON.stringify(result));
              return;
            }
            expect(counter).toBeGreaterThan(1);
            expect(req.requestHeaders['if-none-match']).toEqual('foobar');
            req.respond(304, {}, '');
          });

          resource.get({ bar: 10 })
          .then((res) => res.json())
          .then((data) => {
            expect(data.hello).toEqual('world');
            return resource.get({ bar: 10 });
          })
          .then((res) => res.json())
          .then((data) => {
            expect(data.hello).toEqual('world');
          })
          .then(done, done.fail);
        });
      });

      describe('when server responds with cache-control headers', function() {
        it('caches subsequent cache-able requests with last-modified', function(done) {
          var resource = new Resource(descriptor);
          let counter = 0;

          server.respondWith('GET', '/v1/foo?bar=10', function(req) {
            counter++;

            expect(req.requestHeaders['if-modified-since']).toBeUndefined();
            if (!req.requestHeaders['if-modified-since']) {
              req.respond(200, {
                'Content-Type': 'application/json',
                'Last-Modified': 'Tue, 09 Aug 2016 14:23:49 GMT',
                'Cache-Control': 'no-cache'
              }, JSON.stringify({ counter }));
              return;
            }
            req.respond(304, {}, '');
          });

          resource.get({ bar: 10 })
          .then((res) => res.json())
          .then((data) => {
            expect(data.counter).toEqual(1);
            return resource.get({ bar: 10 });
          })
          .then((res) => res.json())
          .then((data) => {
            expect(data.counter).toEqual(2);
            return resource.get({ bar: 10 });
          })
          .then((res) => res.json())
          .then((data) => {
            expect(data.counter).toEqual(3);
          })
          .then(done, done.fail);
        });
      });

      describe('when client requests with no-cache', function() {
        it('caches subsequent cache-able requests with last-modified', function(done) {
          var resource = new Resource(descriptor);
          let counter = 0;

          server.respondWith('GET', '/v1/foo?bar=10', function(req) {
            counter++;

            expect(req.requestHeaders['if-modified-since']).toBeUndefined();
            if (!req.requestHeaders['if-modified-since']) {
              req.respond(200, {
                'Content-Type': 'application/json',
                'Last-Modified': 'Tue, 09 Aug 2016 14:23:49 GMT'
              }, JSON.stringify({ counter }));
              return;
            }
            req.respond(304, {}, '');
          });

          resource.get({ bar: 10 }, { cache: 'no-cache' })
          .then((res) => res.json())
          .then((data) => {
            expect(data.counter).toEqual(1);
            return resource.get({ bar: 10 }, { cache: 'no-cache' });
          })
          .then((res) => res.json())
          .then((data) => {
            expect(data.counter).toEqual(2);
            return resource.get({ bar: 10 }, { cache: 'no-cache' });
          })
          .then((res) => res.json())
          .then((data) => {
            expect(data.counter).toEqual(3);
          })
          .then(done, done.fail);
        });
      });
    });

    describe('#head', function() {
      var descriptor = {
        _links: {
          self: {
            href: '/v1/foo{?bar}'
          }
        }
      };
      var result = {
        hello: 'world'
      };

      var responses = {
        foo: [200, { 'Content-Type': 'application/json' }, JSON.stringify(result)],
      };

      it('returns the result of sending a DELETE request to the resource', function(done) {
        var resource = new Resource(descriptor);
        server.respondWith('HEAD', '/v1/foo', responses.foo);
        resource.head()
        .then((res) => res.json())
        .then((res) => {
          expect(res).toEqual(result);
        })
        .then(done, done.fail);
      });

      describe('when given a params object', function() {
        it('return the result of sending a DELETE request to the templated resource', function(done) {
          var resource = new Resource(descriptor);
          server.respondWith('HEAD', '/v1/foo?bar=10', responses.foo);
          resource.head({ bar: 10 })
          .then((res) => res.json())
          .then((res) => {
            expect(res).toEqual(result);
          })
          .then(done, done.fail);
        });
      });

      describe('when given resource level options', function() {
        it('passes those options to the ajax request method', function(done) {
          var resource = new Resource(descriptor, { headers: { foo: 'bar' } });

          server.respondWith('HEAD', '/v1/foo?bar=10', function(req) {
            expect(req.requestHeaders.foo).toEqual('bar');
            req.respond(200, { 'Content-Type': 'text/plain' }, '');
            done();
          });

          resource.head({ bar: 10 });
        });
      });

      describe('when given request level options', function() {
        it('passes those options to the ajax request method', function(done) {
          var resource = new Resource(descriptor);

          server.respondWith('HEAD', '/v1/foo?bar=10', function(req) {
            expect(req.requestHeaders.foo).toEqual('bar');
            req.respond(200, { 'Content-Type': 'text/plain' }, '');
            done();
          });

          resource.head({ bar: 10 }, { headers: { foo: 'bar' } });
        });
      });

      describe('when given resource and request level options', function() {
        it('passes those options to the ajax request method', function(done) {
          var resource = new Resource(descriptor, { headers: { foo: 'bar' } });

          server.respondWith('HEAD', '/v1/foo?bar=10', function(req) {
            expect(req.requestHeaders.foo).toEqual('baz');
            req.respond(200, { 'Content-Type': 'text/plain' }, '');
            done();
          });

          resource.head({ bar: 10 }, { headers: { foo: 'baz' } });
        });
      });
    });

    describe('#post', function() {
      var descriptor = {
        _links: {
          self: {
            href: '/v1/foo{?baz}'
          }
        }
      };
      var result = {
        hello: 'world'
      };

      var responses = {
        foo: [200, { 'Content-Type': 'application/json' }, JSON.stringify(result)],
      };

      it('returns the result of sending a POST request to the resource', function(done) {
        var resource = new Resource(descriptor);
        server.respondWith('POST', '/v1/foo', responses.foo);
        resource.post()
        .then((res) => res.json())
        .then((res) => {
          expect(res).toEqual(result);
        })
        .then(done, done.fail);
      });

      describe('when given a data object', function() {
        it('returns the result of sending a POST request with data to resource', function(done) {
          var resource = new Resource(descriptor);

          server.respondWith('POST', '/v1/foo', function(req) {
            expect(req.requestBody).toEqual('{"bar":10}');
            req.respond.apply(req, responses.foo);
          });

          resource.post(JSON.stringify({ bar: 10 }))
          .then((res) => res.json())
          .then((res) => {
            expect(res).toEqual(result);
          })
          .then(done, done.fail);
        });
      });

      describe('when given a params object', function() {
        it('returns the result of sending a POST request to the templated resource', function(done) {
          var resource = new Resource(descriptor);
          server.respondWith('POST', '/v1/foo?baz=10', responses.foo);

          resource.post(null, { baz: 10 })
          .then((res) => res.json())
          .then((res) => {
            expect(res).toEqual(result);
          })
          .then(done, done.fail);
        });
      });

      describe('when given a params object and data object', function() {
        it('returns the result of sending a POST request with data to the templated resource', function(done) {
          var resource = new Resource(descriptor);

          server.respondWith('POST', '/v1/foo?baz=10', function(req) {
            expect(req.requestBody).toEqual('{"bar":10}');
            req.respond.apply(req, responses.foo);
          });

          resource.post(JSON.stringify({ bar: 10 }), { baz: 10 })
          .then((res) => res.json())
          .then((res) => {
            expect(res).toEqual(result);
          })
          .then(done, done.fail);
        });
      });

      describe('when given resource level options', function() {
        it('passes those options to the ajax request method', function(done) {
          var resource = new Resource(descriptor, { headers: { foo: 'bar' } });

          server.respondWith('POST', '/v1/foo', function(req) {
            expect(req.requestHeaders.foo).toEqual('bar');
            req.respond(200, { 'Content-Type': 'text/plain' }, '');
            done();
          });

          resource.post(JSON.stringify({ bar: 10 }));
        });
      });

      describe('when given request level options', function() {
        it('passes those options to the ajax request method', function(done) {
          var resource = new Resource(descriptor);

          server.respondWith('POST', '/v1/foo', function(req) {
            expect(req.requestHeaders.foo).toEqual('bar');
            req.respond(200, { 'Content-Type': 'text/plain' }, '');
            done();
          });

          resource.post(JSON.stringify({ bar: 10 }), {}, { headers: { foo: 'bar' } });
        });
      });

      describe('when given resource and request level options', function() {
        it('passes those options to the ajax request method', function(done) {
          var resource = new Resource(descriptor, { headers: { foo: 'bar' } });

          server.respondWith('POST', '/v1/foo', function(req) {
            expect(req.requestHeaders.foo).toEqual('baz');
            req.respond(200, { 'Content-Type': 'text/plain' }, '');
            done();
          });

          resource.post(JSON.stringify({ bar: 10 }), {}, { headers: { foo: 'baz' } });
        });
      });
    });

    describe('#put', function() {
      var descriptor = {
        _links: {
          self: {
            href: '/v1/foo{?baz}'
          }
        }
      };
      var result = {
        hello: 'world'
      };

      var responses = {
        foo: [200, { 'Content-Type': 'application/json' }, JSON.stringify(result)],
      };

      it('returns the result of sending a PUT request to the resource', function(done) {
        var resource = new Resource(descriptor);
        server.respondWith('PUT', '/v1/foo', responses.foo);

        resource.put()
        .then((res) => res.json())
        .then((res) => {
          expect(res).toEqual(result);
        })
        .then(done, done.fail);
      });

      describe('when given a data object', function() {
        it('returns the result of sending a PUT request with data to resource', function(done) {
          var resource = new Resource(descriptor);

          server.respondWith('PUT', '/v1/foo', function(req) {
            expect(req.requestBody).toEqual('{"bar":10}');
            req.respond.apply(req, responses.foo);
          });

          resource.put(JSON.stringify({ bar: 10 }))
          .then((res) => res.json())
          .then((res) => {
            expect(res).toEqual(result);
          })
          .then(done, done.fail);
        });
      });

      describe('when given a params object', function() {
        it('returns the result of sending a PUT request to the templated resource', function(done) {
          var resource = new Resource(descriptor);
          server.respondWith('PUT', '/v1/foo?baz=10', responses.foo);

          resource.put(null, { baz: 10 })
          .then((res) => res.json())
          .then((res) => {
            expect(res).toEqual(result);
          })
          .then(done, done.fail);
        });
      });

      describe('when given a params object and data object', function() {
        it('returns the result of sending a PUT request with data to the templated resource', function(done) {
          var resource = new Resource(descriptor);

          server.respondWith('PUT', '/v1/foo?baz=10', function(req) {
            expect(req.requestBody).toEqual('{"bar":10}');
            req.respond.apply(req, responses.foo);
          });

          resource.put(JSON.stringify({ bar: 10 }), { baz: 10 })
          .then((res) => res.json())
          .then((res) => {
            expect(res).toEqual(result);
          })
          .then(done, done.fail);
        });
      });

      describe('when given resource level options', function() {
        it('passes those options to the ajax request method', function(done) {
          var resource = new Resource(descriptor, { headers: { foo: 'bar' } });

          server.respondWith('PUT', '/v1/foo', function(req) {
            expect(req.requestHeaders.foo).toEqual('bar');
            req.respond(200, { 'Content-Type': 'text/plain' }, '');
            done();
          });

          resource.put(JSON.stringify({ bar: 10 }));
        });
      });

      describe('when given request level options', function() {
        it('passes those options to the ajax request method', function(done) {
          var resource = new Resource(descriptor);

          server.respondWith('PUT', '/v1/foo', function(req) {
            expect(req.requestHeaders.foo).toEqual('bar');
            req.respond(200, { 'Content-Type': 'text/plain' }, '');
            done();
          });

          resource.put(JSON.stringify({ bar: 10 }), {}, { headers: { foo: 'bar' } });
        });
      });

      describe('when given resource and request level options', function() {
        it('passes those options to the ajax request method', function(done) {
          var resource = new Resource(descriptor, { headers: { foo: 'bar' } });

          server.respondWith('PUT', '/v1/foo', function(req) {
            expect(req.requestHeaders.foo).toEqual('baz');
            req.respond(200, { 'Content-Type': 'text/plain' }, '');
            done();
          });

          resource.put(JSON.stringify({ bar: 10 }), {}, { headers: { foo: 'baz' } });
        });
      });
    });

    describe('#patch', function() {
      var descriptor = {
        _links: {
          self: {
            href: '/v1/foo{?baz}'
          }
        }
      };
      var result = {
        hello: 'world'
      };

      var responses = {
        foo: [200, { 'Content-Type': 'application/json' }, JSON.stringify(result)],
      };

      it('returns the result of sending a PATCH request to the resource', function(done) {
        var resource = new Resource(descriptor);
        server.respondWith('PATCH', '/v1/foo', responses.foo);

        resource.patch()
        .then((res) => res.json())
        .then((res) => {
          expect(res).toEqual(result);
        })
        .then(done, done.fail);
      });

      describe('when given a data object', function() {
        it('returns the result of sending a PATCH request with data to resource', function(done) {
          var resource = new Resource(descriptor);

          server.respondWith('PATCH', '/v1/foo', function(req) {
            expect(req.requestBody).toEqual('{"bar":10}');
            req.respond.apply(req, responses.foo);
          });

          resource.patch(JSON.stringify({ bar: 10 }))
          .then((res) => res.json())
          .then((res) => {
            expect(res).toEqual(result);
          })
          .then(done, done.fail);
        });
      });

      describe('when given a params object', function() {
        it('returns the result of sending a PATCH request to the templated resource', function(done) {
          var resource = new Resource(descriptor);
          server.respondWith('PATCH', '/v1/foo?baz=10', responses.foo);

          resource.patch(null, { baz: 10 })
          .then((res) => res.json())
          .then((res) => {
            expect(res).toEqual(result);
          })
          .then(done, done.fail);
        });
      });

      describe('when given a params object and data object', function() {
        it('returns the result of sending a PATCH request with data to the templated resource', function(done) {
          var resource = new Resource(descriptor);

          server.respondWith('PATCH', '/v1/foo?baz=10', function(req) {
            expect(req.requestBody).toEqual('{"bar":10}');
            req.respond.apply(req, responses.foo);
          });

          resource.patch(JSON.stringify({ bar: 10 }), { baz: 10 })
          .then((res) => res.json())
          .then((res) => {
            expect(res).toEqual(result);
          })
          .then(done, done.fail);
        });
      });

      describe('when given resource level options', function() {
        it('passes those options to the ajax request method', function(done) {
          var resource = new Resource(descriptor, { headers: { foo: 'bar' } });

          server.respondWith('PATCH', '/v1/foo', function(req) {
            expect(req.requestHeaders.foo).toEqual('bar');
            req.respond(200, { 'Content-Type': 'text/plain' }, '');
            done();
          });

          resource.patch(JSON.stringify({ bar: 10 }));
        });
      });

      describe('when given request level options', function() {
        it('passes those options to the ajax request method', function(done) {
          var resource = new Resource(descriptor);

          server.respondWith('PATCH', '/v1/foo', function(req) {
            expect(req.requestHeaders.foo).toEqual('bar');
            req.respond(200, { 'Content-Type': 'text/plain' }, '');
            done();
          });

          resource.patch(JSON.stringify({ bar: 10 }), {}, { headers: { foo: 'bar' } });
        });
      });

      describe('when given resource and request level options', function() {
        it('passes those options to the ajax request method', function(done) {
          var resource = new Resource(descriptor, { headers: { foo: 'bar' } });

          server.respondWith('PATCH', '/v1/foo', function(req) {
            expect(req.requestHeaders.foo).toEqual('baz');
            req.respond(200, { 'Content-Type': 'text/plain' }, '');
            done();
          });

          resource.patch(JSON.stringify({ bar: 10 }), {}, { headers: { foo: 'baz' } });
        });
      });
    });

    describe('#delete', function() {
      var descriptor = {
        _links: {
          self: {
            href: '/v1/foo{?baz}'
          }
        }
      };
      var result = {
        hello: 'world'
      };

      var responses = {
        foo: [200, { 'Content-Type': 'application/json' }, JSON.stringify(result)],
      };

      it('returns the result of sending a DELETE request to the resource', function(done) {
        var resource = new Resource(descriptor);
        server.respondWith('DELETE', '/v1/foo', responses.foo);

        resource.delete()
        .then((res) => res.json())
        .then((res) => {
          expect(res).toEqual(result);
        })
        .then(done, done.fail);
      });

      describe('when given a data object', function() {
        it('returns the result of sending a DELETE request with data to resource', function(done) {
          var resource = new Resource(descriptor);

          server.respondWith('DELETE', '/v1/foo', function(req) {
            expect(req.requestBody).toEqual('{"bar":10}');
            req.respond.apply(req, responses.foo);
          });

          resource.delete(JSON.stringify({ bar: 10 }))
          .then((res) => res.json())
          .then((res) => {
            expect(res).toEqual(result);
          })
          .then(done, done.fail);
        });
      });

      describe('when given a params object', function() {
        it('returns the result of sending a DELETE request to the templated resource', function(done) {
          var resource = new Resource(descriptor);
          server.respondWith('DELETE', '/v1/foo?baz=10', responses.foo);

          resource.delete(null, { baz: 10 })
          .then((res) => res.json())
          .then((res) => {
            expect(res).toEqual(result);
          })
          .then(done, done.fail);
        });
      });

      describe('when given a params object and JSON data', function() {
        it('returns the result of sending a DELETE request with data to the templated resource', function(done) {
          var resource = new Resource(descriptor);

          server.respondWith('DELETE', '/v1/foo?baz=10', function(req) {
            expect(req.requestBody).toEqual('{"bar":10}');
            req.respond.apply(req, responses.foo);
          });

          resource.delete(JSON.stringify({ bar: 10 }), { baz: 10 })
          .then((res) => res.json())
          .then((res) => {
            expect(res).toEqual(result);
          })
          .then(done, done.fail);
        });
      });

      describe('when given resource level options', function() {
        it('passes those options to the ajax request method', function(done) {
          var resource = new Resource(descriptor, { headers: { foo: 'bar' } });

          server.respondWith('DELETE', '/v1/foo', function(req) {
            expect(req.requestHeaders.foo).toEqual('bar');
            req.respond(200, { 'Content-Type': 'text/plain' }, '');
            done();
          });

          resource.delete(JSON.stringify({ bar: 10 }));
        });
      });

      describe('when given request level options', function() {
        it('passes those options to the ajax request method', function(done) {
          var resource = new Resource(descriptor);

          server.respondWith('DELETE', '/v1/foo', function(req) {
            expect(req.requestHeaders.foo).toEqual('bar');
            req.respond(200, { 'Content-Type': 'text/plain' }, '');
            done();
          });

          resource.delete(JSON.stringify({ bar: 10 }), {}, { headers: { foo: 'bar' } });
        });
      });

      describe('when given resource and request level options', function() {
        it('passes those options to the ajax request method', function(done) {
          var resource = new Resource(descriptor, { headers: { foo: 'bar' } });

          server.respondWith('DELETE', '/v1/foo', function(req) {
            expect(req.requestHeaders.foo).toEqual('baz');
            req.respond(200, { 'Content-Type': 'text/plain' }, '');
            done();
          });

          resource.delete(JSON.stringify({ bar: 10 }), {}, { headers: { foo: 'baz' } });
        });
      });
    });
  });

  describe('when multiple requests are made with the same root options', function() {
    var server;
    var descriptor = {
      _links: {
        self: {
          href: '/v1/foo{?baz}'
        }
      }
    };
    var otherDescriptor = {
      _links: {
        self: {
          href: '/v1/bar{?baz}'
        }
      }
    };

    beforeEach(function() {
      server = sinon.fakeServer.create();
      server.autoRespond = true;
    });

    afterEach(function() {
      server.restore();
      server = null;
    });

    it('does not modify the root options object', function(done) {
      var options = { headers: { foo: 'bar' } };
      var resource = new Resource(descriptor, options);
      var resourceB = new Resource(otherDescriptor, options);

      server.respondWith('GET', '/v1/foo', function(req) {
        expect(req.requestHeaders.foo).toEqual('baz');
        req.respond(200, { 'Content-Type': 'text/plain' }, '');
      });

      server.respondWith('GET', '/v1/bar', function(req) {
        expect(req.requestHeaders.foo).toEqual('bar');
        req.respond(200, { 'Content-Type': 'text/plain' }, '');
      });

      resource.get({}, { headers: { foo: 'baz' } })
      .then(function() { return resourceB.get(); })
      .then(done, done.fail);
    });
  });
});
