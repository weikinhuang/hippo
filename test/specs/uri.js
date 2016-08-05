import Uri from 'src/uri';

describe('Uri', function() {
  it('can be instantiated', function() {
    expect(new Uri() instanceof Uri).toBeTruthy();
  });

  describe('#parse', function() {
    describe('when given no uri', function() {
      var uri = '',
          emptyUri = Uri.parse(uri);

      it('has no a protocol', function() {
        expect(emptyUri.protocol).toEqual('');
      });

      it('has no a user', function() {
        expect(emptyUri.user).toEqual('');
      });

      it('has no a password', function() {
        expect(emptyUri.password).toEqual('');
      });

      it('has no a host', function() {
        expect(emptyUri.host).toEqual('');
      });

      it('has no a port', function() {
        expect(emptyUri.port).toEqual('');
      });

      it('has no a path', function() {
        expect(emptyUri.path).toEqual('');
      });

      it('has no a query', function() {
        expect(emptyUri.query).toEqual('');
      });

      it('has no a fragment', function() {
        expect(emptyUri.fragment).toEqual('');
      });

      it('has no userInfo', function() {
        expect(emptyUri.userInfo()).toEqual('');
      });

      it('has no authority', function() {
        expect(emptyUri.authority()).toEqual('');
      });

      it('has no site', function() {
        expect(emptyUri.site()).toEqual('');
      });

      it('toString matches original uri string', function() {
        expect(emptyUri.toString()).toEqual(uri);
      });
    });

    describe('when given a full uri', function() {
      var uri = 'http://user:password@example.com:8080/path?query=value#fragment',
          fullUri = Uri.parse(uri);

      it('has a protocol', function() {
        expect(fullUri.protocol).toEqual('http');
      });

      it('has a user', function() {
        expect(fullUri.user).toEqual('user');
      });

      it('has a password', function() {
        expect(fullUri.password).toEqual('password');
      });

      it('has a host', function() {
        expect(fullUri.host).toEqual('example.com');
      });

      it('has a port', function() {
        expect(fullUri.port).toEqual('8080');
      });

      it('has a path', function() {
        expect(fullUri.path).toEqual('/path');
      });

      it('has a query', function() {
        expect(fullUri.query).toEqual('query=value');
      });

      it('has a fragment', function() {
        expect(fullUri.fragment).toEqual('fragment');
      });

      it('has userInfo', function() {
        expect(fullUri.userInfo()).toEqual('user:password');
      });

      it('has an authority', function() {
        expect(fullUri.authority()).toEqual('user:password@example.com:8080');
      });

      it('has a site', function() {
        expect(fullUri.site()).toEqual('http://user:password@example.com:8080');
      });

      it('toString matches original uri string', function() {
        expect(fullUri.toString()).toEqual(uri);
      });
    });

    describe('when created with string components', function() {
      var uri = 'http://example.com',
          stringUri = new Uri({ protocol: 'http', host: 'example.com' });

      it('has a site value of "http://example.com"', function() {
        expect(stringUri.site()).toEqual(uri);
      });

      it('is equivalent to the parsed URI', function() {
        expect(stringUri).toEqual(Uri.parse(uri));
      });
    });

    describe('when given only an authority', function() {
      var authorityUri = new Uri({
        user: 'user',
        host: 'example.com'
      });

      it('does not infer the protocol', function() {
        expect(authorityUri.port).toEqual('');
      });

      it('does not inder the port', function() {
        expect(authorityUri.port).toEqual('');
      });

      it('has a protocol relative site value of "//user@example.com"', function() {
        expect(authorityUri.site()).toEqual('//user@example.com');
      });
    });
  });

  describe('#encodeComponent', function() {
    it('returns the component in percent encoding', function() {
      expect(Uri.encodeComponent('Hello World')).toEqual('Hello%20World');
    });

    describe('when encoding a string with an existing encoding', function() {
      it('returns the correct percent encoded string', function() {
        expect(Uri.encodeComponent('JK%4c', '0-9A-IKM-Za-z%')).toEqual('%4AK%4c');
      });
    });

    describe('when encoding a multibyte string', function() {
      it('returns the correct percent encoded string', function() {
        expect(Uri.encodeComponent('günther')).toEqual('g%C3%BCnther');
      });
    });

    describe('when encoding a string with ASCII chars 0-15', function() {
      it('returns the correct percent encoded string', function() {
        expect(Uri.encodeComponent('one\ntwo')).toEqual('one%0Atwo');
      });
    });
  });
});
