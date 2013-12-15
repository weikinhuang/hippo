/* global describe, it */
define(['chai', 'uri'], function(chai, Uri) {
  'use strict';

  var expect = chai.expect;

  describe('Uri', function() {
    it('can be instantiated', function() {
      expect(new Uri()).to.be.an.instanceOf(Uri);
    });

    describe('#parse', function() {
      describe('when given no uri', function() {
        var uri = '',
            emptyUri = Uri.parse(uri);

        it('has no a protocol', function() {
          expect(emptyUri.protocol).to.equal('');
        });

        it('has no a user', function() {
          expect(emptyUri.user).to.equal('');
        });

        it('has no a password', function() {
          expect(emptyUri.password).to.equal('');
        });

        it('has no a host', function() {
          expect(emptyUri.host).to.equal('');
        });

        it('has no a port', function() {
          expect(emptyUri.port).to.equal('');
        });

        it('has no a path', function() {
          expect(emptyUri.path).to.equal('');
        });

        it('has no a query', function() {
          expect(emptyUri.query).to.equal('');
        });

        it('has no a fragment', function() {
          expect(emptyUri.fragment).to.equal('');
        });

        it('has no userInfo', function() {
          expect(emptyUri.userInfo()).to.equal('');
        });

        it('has no authority', function() {
          expect(emptyUri.authority()).to.equal('');
        });

        it('has no site', function() {
          expect(emptyUri.site()).to.equal('');
        });

        it('toString matches original uri string', function() {
          expect(emptyUri.toString()).to.equal(uri);
        });
      });

      describe('when given a full uri', function() {
        var uri = 'http://user:password@example.com:8080/path?query=value#fragment',
            fullUri = Uri.parse(uri);

        it('has a protocol', function() {
          expect(fullUri.protocol).to.equal('http');
        });

        it('has a user', function() {
          expect(fullUri.user).to.equal('user');
        });

        it('has a password', function() {
          expect(fullUri.password).to.equal('password');
        });

        it('has a host', function() {
          expect(fullUri.host).to.equal('example.com');
        });

        it('has a port', function() {
          expect(fullUri.port).to.equal('8080');
        });

        it('has a path', function() {
          expect(fullUri.path).to.equal('/path');
        });

        it('has a query', function() {
          expect(fullUri.query).to.equal('query=value');
        });

        it('has a fragment', function() {
          expect(fullUri.fragment).to.equal('fragment');
        });

        it('has userInfo', function() {
          expect(fullUri.userInfo()).to.equal('user:password');
        });

        it('has an authority', function() {
          expect(fullUri.authority()).to.equal('user:password@example.com:8080');
        });

        it('has a site', function() {
          expect(fullUri.site()).to.equal('http://user:password@example.com:8080');
        });

        it('toString matches original uri string', function() {
          expect(fullUri.toString()).to.equal(uri);
        });
      });
    });

  });
});