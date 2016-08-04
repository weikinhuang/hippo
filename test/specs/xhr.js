define(['chai-as-promised', 'src/xhr'], function(chaiAsPromised, xhr) {
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
        expect(xhr('/').then).to.be.an('function');
      });

      it('returns a resolved promise on XHR success', function() {
        return expect(xhr('/').then(function(res) { return res.text(); })).to.become('hello world');
      });

      it('returns a successful promise on XHR complete', function() {
        return expect(xhr('/foo').then(function(res) { return res.status; })).to.become(404);
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

      describe('when specifying request method', function() {
        it('capitalizes the method', function() {
          var uri = '/';

          server.respondWith(function(request) {
            expect(request.method).to.equal('PATCH');
            request.respond(200, { "Content-Type": "text/plain" }, '');
          });

          return xhr(uri, { method: 'patch' });
        });
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

          return xhr(uri);
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

          return xhr(uri);
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

          return xhr(uri);
        });

        it('doesn\'t override withCredentials to be true', function() {
          var uri = 'http://example.com/';

          server.respondWith(function(request) {
            expect(request.url).to.equal(uri);
            request.respond(200, { "Content-Type": "text/plain" }, '');
            expect(request.withCredentials).to.be.false;
            expect(request.crossOrigin).to.be.true;
          });

          return xhr(uri, { withCredentials: false });
        });
      });
    });
  });
});
