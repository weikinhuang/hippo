define(['lib/resource'], function(Resource) {
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
  });
});
