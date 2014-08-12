define(['lib/client'], function(Client) {
  describe.only('Client', function() {
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
      it('description', function() {
      });
    });
  });
});

