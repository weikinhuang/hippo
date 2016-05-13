define(['chai-as-promised', 'promise', 'lib/xhr'], function(chaiAsPromised, Promise, xhr) {
  chai.use(chaiAsPromised);

  describe('xhr', function() {
    var server;

    describe('return values', function() {
      beforeEach(function() {
        server = sinon.fakeServer.create();
        server.respondWith('GET', '/', [200, { 'Content-Type': 'text/plain' }, 'hello world']);
        server.autoRespond = true;
      });

      afterEach(function() {
        server.restore();
        server = null;
      });

      it('returns a promise', function() {
        expect(xhr({ url: '/' })).to.be.an.instanceOf(Promise);
      });

      it('returns a resolved promise on XHR success', function() {
        return expect(xhr({ url: '/' })).to.become('hello world');
      });

      it('returns a rejected promise on XHR failure', function() {
        return expect(xhr({ url: '/foo' })).to.eventually.be.rejected;
      });
    });

    describe('request paramaters', function() {
      beforeEach(function() {
        server = sinon.fakeServer.create();
        server.autoRespond = true;
      });

      afterEach(function() {
        server.restore();
        server = null;
      });

      describe('when making a request to the same domain', function() {
        it('sets cross origin properties', function() {
          var uri = '/';

          server.respondWith(function(request) {
            expect(request.url).to.equal(uri);
            request.respond(200, { "Content-Type": "text/plain" }, '');
            expect(request.withCredentials).to.be.undefined;
            expect(request.crossOrigin).to.be.false;
          });

          return xhr({ url: uri });
        });
      });

      describe('when making a request to the same domain but a different port', function() {
        it('sets cross origin properties', function() {
          var uri = 'http://localhost:8000';

          server.respondWith(function(request) {
            expect(request.url).to.equal(uri);
            request.respond(200, { "Content-Type": "text/plain" }, '');
            expect(request.withCredentials).to.be.undefined;
            expect(request.crossOrigin).to.be.true;
          });

          return xhr({ url: uri });
        });
      });

      describe('when making a request to the same domain', function() {
        it('sets cross origin properties', function() {
          var uri = 'http://example.com/';

          server.respondWith(function(request) {
            expect(request.url).to.equal(uri);
            request.respond(200, { "Content-Type": "text/plain" }, '');
            expect(request.withCredentials).to.be.undefined;
            expect(request.crossOrigin).to.be.true;
          });

          return xhr({ url: uri });
        });

        it('doesn\'t override withCredentials to be true', function() {
          var uri = 'http://example.com/';

          server.respondWith(function(request) {
            expect(request.url).to.equal(uri);
            request.respond(200, { "Content-Type": "text/plain" }, '');
            expect(request.withCredentials).to.be.false;
            expect(request.crossOrigin).to.be.true;
          });

          return xhr({ url: uri, withCredentials: false });
        });
      });
    });
  });
});
