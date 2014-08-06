import Client from 'lib/client';

var expect = chai.expect;

describe('Client', function() {
  it('can be instantiated', function() {
    expect(new Client()).to.be.an.instanceOf(Client);
  });

  describe('#walk', function() {
    it('is a function', function() {
      var client = new Client();

      expect(client.walk).to.be.a('function');
    });
  });
});
