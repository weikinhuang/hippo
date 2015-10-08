define(['chai-as-promised', 'lib/resource'], function(chaiAsPromised, Resource) {
  chai.use(chaiAsPromised);

  describe('Resource', function() {
    it('is a constructor', function() {
      expect(new Resource({ _links: {} })).to.be.an.instanceOf(Resource);
    });

    describe('constructor', function() {
      describe('when not given a descriptor', function() {
        it('throws an error', function() {
          expect(function() {
            new Resource();
          }).to.throw(/Resource constructor requires a description/);
        });
      });

      describe('when given an ill formed descriptor', function() {
        it('throws an error', function() {
          expect(function() {
            new Resource({ lol: 'bad data' });
          }).to.throw(/Resource constructor given a malformed descriptor/);
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
          }).to.throw(/Malformed connection/);
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

        expect(resource.description()).to.equal(descriptor._links);
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
          }).to.throw(/No shortname given for connection/);
        });
      });

      describe('when given a shortname that is not known', function() {
        it('throws an error', function() {
          expect(function() {
            resource.getConnection('bar');
          }).to.throw(/Unknown connection/);
        });
      });

      describe('when given a shortname that is known', function() {
        it('returns the href for that connection', function() {
          expect(resource.getConnection('self')).to.equal('/');
          expect(resource.getConnection('foo')).to.equal('/foo');
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

          expect(resource.getConnection(connection)).to.equal('/foo?bar=5');
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
          foo: [200, { "Content-Type": "application/json" }, JSON.stringify(result)],
        };

        it('returns the result of sending a GET request to the resource', function() {
          var resource = new Resource(descriptor);
          server.respondWith('GET', '/v1/foo', responses.foo);
          return expect(resource.get()).to.become(result);
        });

        describe('when given a params object', function() {
          it('return the result of sending a GET request to the templated resource', function() {
            var resource = new Resource(descriptor);
            server.respondWith('GET', '/v1/foo?bar=10', responses.foo);
            return expect(resource.get({ bar: 10 })).to.become(result);
          });
        });

        describe('when given resource level options', function() {
          it('passes those options to the ajax request method', function() {
            var resource = new Resource(descriptor, { headers: { foo: 'bar' } });

            server.respondWith('GET', '/v1/foo?bar=10', function(req) {
              expect(req.requestHeaders.foo).to.equal('bar');
              req.respond(200, { "Content-Type": "text/plain" }, '');
            });

            return resource.get({ bar: 10 });
          });
        });

        describe('when given request level options', function() {
          it('passes those options to the ajax request method', function() {
            var resource = new Resource(descriptor);

            server.respondWith('GET', '/v1/foo?bar=10', function(req) {
              expect(req.requestHeaders.foo).to.equal('bar');
              req.respond(200, { "Content-Type": "text/plain" }, '');
            });

            return resource.get({ bar: 10 }, { headers: { foo: 'bar' } });
          });
        });

        describe('when given resource and request level options', function() {
          it('passes those options to the ajax request method', function() {
            var resource = new Resource(descriptor, { headers: { foo: 'bar' } });

            server.respondWith('GET', '/v1/foo?bar=10', function(req) {
              expect(req.requestHeaders.foo).to.equal('baz');
              req.respond(200, { "Content-Type": "text/plain" }, '');
            });

            return resource.get({ bar: 10 }, { headers: { foo: 'baz' } });
          });
        });
      });

      describe('#delete', function() {
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
          foo: [200, { "Content-Type": "application/json" }, JSON.stringify(result)],
        };

        it('returns the result of sending a DELETE request to the resource', function() {
          var resource = new Resource(descriptor);
          server.respondWith('DELETE', '/v1/foo', responses.foo);
          return expect(resource.delete()).to.become(result);
        });

        describe('when given a params object', function() {
          it('return the result of sending a DELETE request to the templated resource', function() {
            var resource = new Resource(descriptor);
            server.respondWith('DELETE', '/v1/foo?bar=10', responses.foo);
            return expect(resource.delete({ bar: 10 })).to.become(result);
          });
        });

        describe('when given resource level options', function() {
          it('passes those options to the ajax request method', function() {
            var resource = new Resource(descriptor, { headers: { foo: 'bar' } });

            server.respondWith('DELETE', '/v1/foo?bar=10', function(req) {
              expect(req.requestHeaders.foo).to.equal('bar');
              req.respond(200, { "Content-Type": "text/plain" }, '');
            });

            return resource.delete({ bar: 10 });
          });
        });

        describe('when given request level options', function() {
          it('passes those options to the ajax request method', function() {
            var resource = new Resource(descriptor);

            server.respondWith('DELETE', '/v1/foo?bar=10', function(req) {
              expect(req.requestHeaders.foo).to.equal('bar');
              req.respond(200, { "Content-Type": "text/plain" }, '');
            });

            return resource.delete({ bar: 10 }, { headers: { foo: 'bar' } });
          });
        });

        describe('when given resource and request level options', function() {
          it('passes those options to the ajax request method', function() {
            var resource = new Resource(descriptor, { headers: { foo: 'bar' } });

            server.respondWith('DELETE', '/v1/foo?bar=10', function(req) {
              expect(req.requestHeaders.foo).to.equal('baz');
              req.respond(200, { "Content-Type": "text/plain" }, '');
            });

            return resource.delete({ bar: 10 }, { headers: { foo: 'baz' } });
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
          foo: [200, { "Content-Type": "application/json" }, JSON.stringify(result)],
        };

        it('returns the result of sending a DELETE request to the resource', function() {
          var resource = new Resource(descriptor);
          server.respondWith('HEAD', '/v1/foo', responses.foo);
          return expect(resource.head()).to.become(result);
        });

        describe('when given a params object', function() {
          it('return the result of sending a DELETE request to the templated resource', function() {
            var resource = new Resource(descriptor);
            server.respondWith('HEAD', '/v1/foo?bar=10', responses.foo);
            return expect(resource.head({ bar: 10 })).to.become(result);
          });
        });

        describe('when given resource level options', function() {
          it('passes those options to the ajax request method', function() {
            var resource = new Resource(descriptor, { headers: { foo: 'bar' } });

            server.respondWith('HEAD', '/v1/foo?bar=10', function(req) {
              expect(req.requestHeaders.foo).to.equal('bar');
              req.respond(200, { "Content-Type": "text/plain" }, '');
            });

            return resource.head({ bar: 10 });
          });
        });

        describe('when given request level options', function() {
          it('passes those options to the ajax request method', function() {
            var resource = new Resource(descriptor);

            server.respondWith('HEAD', '/v1/foo?bar=10', function(req) {
              expect(req.requestHeaders.foo).to.equal('bar');
              req.respond(200, { "Content-Type": "text/plain" }, '');
            });

            return resource.head({ bar: 10 }, { headers: { foo: 'bar' } });
          });
        });

        describe('when given resource and request level options', function() {
          it('passes those options to the ajax request method', function() {
            var resource = new Resource(descriptor, { headers: { foo: 'bar' } });

            server.respondWith('HEAD', '/v1/foo?bar=10', function(req) {
              expect(req.requestHeaders.foo).to.equal('baz');
              req.respond(200, { "Content-Type": "text/plain" }, '');
            });

            return resource.head({ bar: 10 }, { headers: { foo: 'baz' } });
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
          foo: [200, { "Content-Type": "application/json" }, JSON.stringify(result)],
        };

        it('returns the result of sending a POST request to the resource', function() {
          var resource = new Resource(descriptor);
          server.respondWith('POST', '/v1/foo', responses.foo);
          return expect(resource.post()).to.become(result);
        });

        describe('when given a data object', function() {
          it('returns the result of sending a POST request with data to resource', function() {
            var resource = new Resource(descriptor);

            server.respondWith('POST', '/v1/foo', function(req) {
              expect(req.requestBody).to.equal('bar=10');
              req.respond.apply(req, responses.foo);
            });

            return expect(resource.post({ bar: 10 })).to.become(result);
          });
        });

        describe('when given a params object', function() {
          it('returns the result of sending a POST request to the templated resource', function() {
            var resource = new Resource(descriptor);
            server.respondWith('POST', '/v1/foo?baz=10', responses.foo);
            return expect(resource.post({}, { baz: 10 })).to.become(result);
          });
        });

        describe('when given a params object and data object', function() {
          it('returns the result of sending a POST request with data to the templated resource', function() {
            var resource = new Resource(descriptor);

            server.respondWith('POST', '/v1/foo?baz=10', function(req) {
              expect(req.requestBody).to.equal('bar=10');
              req.respond.apply(req, responses.foo);
            });

            return expect(resource.post({ bar: 10 }, { baz: 10 })).to.become(result);
          });
        });

        describe('when given resource level options', function() {
          it('passes those options to the ajax request method', function() {
            var resource = new Resource(descriptor, { headers: { foo: 'bar' } });

            server.respondWith('POST', '/v1/foo', function(req) {
              expect(req.requestHeaders.foo).to.equal('bar');
              req.respond(200, { "Content-Type": "text/plain" }, '');
            });

            return resource.post({ bar: 10 });
          });
        });

        describe('when given request level options', function() {
          it('passes those options to the ajax request method', function() {
            var resource = new Resource(descriptor);

            server.respondWith('POST', '/v1/foo', function(req) {
              expect(req.requestHeaders.foo).to.equal('bar');
              req.respond(200, { "Content-Type": "text/plain" }, '');
            });

            return resource.post({ bar: 10 }, {}, { headers: { foo: 'bar' } });
          });
        });

        describe('when given resource and request level options', function() {
          it('passes those options to the ajax request method', function() {
            var resource = new Resource(descriptor, { headers: { foo: 'bar' } });

            server.respondWith('POST', '/v1/foo', function(req) {
              expect(req.requestHeaders.foo).to.equal('baz');
              req.respond(200, { "Content-Type": "text/plain" }, '');
            });

            return resource.post({ bar: 10 }, {}, { headers: { foo: 'baz' } });
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
          foo: [200, { "Content-Type": "application/json" }, JSON.stringify(result)],
        };

        it('returns the result of sending a PUT request to the resource', function() {
          var resource = new Resource(descriptor);
          server.respondWith('PUT', '/v1/foo', responses.foo);
          return expect(resource.put()).to.become(result);
        });

        describe('when given a data object', function() {
          it('returns the result of sending a PUT request with data to resource', function() {
            var resource = new Resource(descriptor);

            server.respondWith('PUT', '/v1/foo', function(req) {
              expect(req.requestBody).to.equal('bar=10');
              req.respond.apply(req, responses.foo);
            });

            return expect(resource.put({ bar: 10 })).to.become(result);
          });
        });

        describe('when given a params object', function() {
          it('returns the result of sending a PUT request to the templated resource', function() {
            var resource = new Resource(descriptor);
            server.respondWith('PUT', '/v1/foo?baz=10', responses.foo);
            return expect(resource.put({}, { baz: 10 })).to.become(result);
          });
        });

        describe('when given a params object and data object', function() {
          it('returns the result of sending a PUT request with data to the templated resource', function() {
            var resource = new Resource(descriptor);

            server.respondWith('PUT', '/v1/foo?baz=10', function(req) {
              expect(req.requestBody).to.equal('bar=10');
              req.respond.apply(req, responses.foo);
            });

            return expect(resource.put({ bar: 10 }, { baz: 10 })).to.become(result);
          });
        });

        describe('when given resource level options', function() {
          it('passes those options to the ajax request method', function() {
            var resource = new Resource(descriptor, { headers: { foo: 'bar' } });

            server.respondWith('PUT', '/v1/foo', function(req) {
              expect(req.requestHeaders.foo).to.equal('bar');
              req.respond(200, { "Content-Type": "text/plain" }, '');
            });

            return resource.put({ bar: 10 });
          });
        });

        describe('when given request level options', function() {
          it('passes those options to the ajax request method', function() {
            var resource = new Resource(descriptor);

            server.respondWith('PUT', '/v1/foo', function(req) {
              expect(req.requestHeaders.foo).to.equal('bar');
              req.respond(200, { "Content-Type": "text/plain" }, '');
            });

            return resource.put({ bar: 10 }, {}, { headers: { foo: 'bar' } });
          });
        });

        describe('when given resource and request level options', function() {
          it('passes those options to the ajax request method', function() {
            var resource = new Resource(descriptor, { headers: { foo: 'bar' } });

            server.respondWith('PUT', '/v1/foo', function(req) {
              expect(req.requestHeaders.foo).to.equal('baz');
              req.respond(200, { "Content-Type": "text/plain" }, '');
            });

            return resource.put({ bar: 10 }, {}, { headers: { foo: 'baz' } });
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
          foo: [200, { "Content-Type": "application/json" }, JSON.stringify(result)],
        };

        it('returns the result of sending a PATCH request to the resource', function() {
          var resource = new Resource(descriptor);
          server.respondWith('PATCH', '/v1/foo', responses.foo);
          return expect(resource.patch()).to.become(result);
        });

        describe('when given a data object', function() {
          it('returns the result of sending a PATCH request with data to resource', function() {
            var resource = new Resource(descriptor);

            server.respondWith('PATCH', '/v1/foo', function(req) {
              expect(req.requestBody).to.equal('bar=10');
              req.respond.apply(req, responses.foo);
            });

            return expect(resource.patch({ bar: 10 })).to.become(result);
          });
        });

        describe('when given a params object', function() {
          it('returns the result of sending a PATCH request to the templated resource', function() {
            var resource = new Resource(descriptor);
            server.respondWith('PATCH', '/v1/foo?baz=10', responses.foo);
            return expect(resource.patch({}, { baz: 10 })).to.become(result);
          });
        });

        describe('when given a params object and data object', function() {
          it('returns the result of sending a PATCH request with data to the templated resource', function() {
            var resource = new Resource(descriptor);

            server.respondWith('PATCH', '/v1/foo?baz=10', function(req) {
              expect(req.requestBody).to.equal('bar=10');
              req.respond.apply(req, responses.foo);
            });

            return expect(resource.patch({ bar: 10 }, { baz: 10 })).to.become(result);
          });
        });

        describe('when given resource level options', function() {
          it('passes those options to the ajax request method', function() {
            var resource = new Resource(descriptor, { headers: { foo: 'bar' } });

            server.respondWith('PATCH', '/v1/foo', function(req) {
              expect(req.requestHeaders.foo).to.equal('bar');
              req.respond(200, { "Content-Type": "text/plain" }, '');
            });

            return resource.patch({ bar: 10 });
          });
        });

        describe('when given request level options', function() {
          it('passes those options to the ajax request method', function() {
            var resource = new Resource(descriptor);

            server.respondWith('PATCH', '/v1/foo', function(req) {
              expect(req.requestHeaders.foo).to.equal('bar');
              req.respond(200, { "Content-Type": "text/plain" }, '');
            });

            return resource.patch({ bar: 10 }, {}, { headers: { foo: 'bar' } });
          });
        });

        describe('when given resource and request level options', function() {
          it('passes those options to the ajax request method', function() {
            var resource = new Resource(descriptor, { headers: { foo: 'bar' } });

            server.respondWith('PATCH', '/v1/foo', function(req) {
              expect(req.requestHeaders.foo).to.equal('baz');
              req.respond(200, { "Content-Type": "text/plain" }, '');
            });

            return resource.patch({ bar: 10 }, {}, { headers: { foo: 'baz' } });
          });
        });
      });
    });
  });
});
