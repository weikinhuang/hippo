// import chaiAsPromised from 'chai-as-promised';
import xhr from 'src/xhr';

// chai.use(chaiAsPromised);

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
      expect(xhr('/')).toEqual(jasmine.any(Promise));
    });

    it('returns a resolved promise on XHR success', function(done) {
      return xhr('/')
      .then((res) => res.text())
      .then((text) => {
        expect(text).toEqual('hello world');
      })
      .then(done);
    });

    it('returns a successful promise on XHR complete', function(done) {
      return xhr('/foo')
      .then((res) => {
        expect(res.status).toEqual(404);
      })
      .then(done);
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
      it('capitalizes the method', function(done) {
        var uri = '/';

        server.respondWith(function(request) {
          expect(request.method).toEqual('PATCH');
          request.respond(200, { "Content-Type": "text/plain" }, '');
          done();
        });

        return xhr(uri, { method: 'patch' });
      });
    });

    describe('when making a request to the same domain', function() {
      it('sets cross origin properties', function(done) {
        var uri = '/';

        server.respondWith(function(request) {
          expect(request.url).toEqual(uri);
          request.respond(200, { "Content-Type": "text/plain" }, '');
          expect(request.withCredentials).toBeFalsy();
          done();
        });

        return xhr(uri);
      });
    });

    describe('when making a request to the same domain but a different port', function() {
      it('sets cross origin properties', function(done) {
        var uri = 'http://localhost:8000';

        server.respondWith(function(request) {
          expect(request.url).toEqual(uri);
          request.respond(200, { "Content-Type": "text/plain" }, '');
          expect(request.withCredentials).toBeTruthy();
          done();
        });

        return xhr(uri);
      });
    });

    describe('when making a request to the same domain', function() {
      it('sets cross origin properties', function(done) {
        var uri = 'http://example.com/';

        server.respondWith(function(request) {
          expect(request.url).toEqual(uri);
          request.respond(200, { "Content-Type": "text/plain" }, '');
          expect(request.withCredentials).toBeTruthy();
          done();
        });

        return xhr(uri);
      });

      it('doesn\'t override withCredentials to be true', function(done) {
        var uri = 'http://example.com/';

        server.respondWith(function(request) {
          expect(request.url).toEqual(uri);
          request.respond(200, { "Content-Type": "text/plain" }, '');
          expect(request.withCredentials).toBeTruthy();
          done();
        });

        return xhr(uri, { withCredentials: false });
      });
    });
  });
});
