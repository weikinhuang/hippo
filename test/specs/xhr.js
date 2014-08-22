define(['chai-as-promised', 'promise', 'lib/xhr'], function(chaiAsPromised, Promise, xhr) {
  chai.use(chaiAsPromised);

  describe('xhr', function() {
    var server;

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
});
