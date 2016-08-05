var ALPHA = "a-zA-Z",
    DIGIT = "0-9",
    GEN_DELIMS = "\\:\\/\\?\\#\\[\\]\\@",
    SUB_DELIMS = "\\!\\$\\&\\'\\(\\)\\*\\+\\,\\;\\=",
    RESERVED = GEN_DELIMS + SUB_DELIMS,
    UNRESERVED = ALPHA + DIGIT + "\\-\\.\\_\\~",
    PCHAR = UNRESERVED + SUB_DELIMS + "\\:\\@",
    SCHEME = ALPHA + DIGIT + "\\-\\+\\.",
    AUTHORITY = PCHAR,
    PATH = PCHAR + "\\/",
    QUERY = PCHAR + "\\/\\?",
    FRAGMENT = PCHAR + "\\/\\?",
    URIREGEX = /^(?:([^:\/?#]+):)?(?:\/\/([^\/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?$/;

function scan(string, regExp, extractionPoint) {
  return regExp.test(string) ? string.match(regExp)[extractionPoint] : null;
}

export default class Uri {
  constructor(components = {}) {
    this.protocol = components.protocol || '';
    this.user = components.user || '';
    this.password = components.password || '';
    this.host = components.host || '';
    this.port = components.port || '';
    this.path = components.path || '';
    this.query = components.query || '';
    this.fragment = components.fragment || '';
  }

  userInfo() {
    return [
      this.user,
      (this.password ? ':' + this.password : '')
    ].join('');
  }

  authority() {
    return [
      (this.user ? this.userInfo() + '@' : ''),
      this.host,
      (this.port ? ':' + this.port : '')
    ].join('');
  }

  site() {
    var authority = this.authority();

    return [
      (this.protocol ? this.protocol + ':' : ''),
      (authority ? '//' + this.authority() : ''),
    ].join('');
  }

  isRelative() {
    return !this.protocol;
  }

  isAbsolute() {
    return !this.isRelative();
  }

  toString() {
    var authority = this.authority();

    return [
      (this.protocol ? this.protocol + ':' : ''),
      (authority ? '//' + authority : ''),
      this.path,
      (this.query ? '?' + this.query : ''),
      (this.fragment ? '#' + this.fragment : '')
    ].join('');
  }

  static parse(uri) {
    if (!uri) { return new Uri(); }

    var uriPieces = uri.match(new RegExp(URIREGEX)),
        protocol = uriPieces[1],
        authority = uriPieces[2],
        path = uriPieces[3],
        query = uriPieces[4],
        fragment = uriPieces[5],
        user, password, host, port, userInfo;

    if (authority) {
      userInfo = scan(authority, /^([^\[\]]*)@/, 1);

      if (userInfo) {
        user = scan(userInfo, /^([^:]*):?/, 1);
        password = scan(userInfo, /:(.*)$/, 1);
      }

      port = scan(authority, /:([^:@\[\]]*?)$/, 1);

      host = authority
      .replace(/^([^\[\]]*)@/, '')
      .replace(/:([^:@\[\]]*?)$/, '');
    }

    return new Uri({
      protocol: protocol,
      user: user,
      password: password,
      host: host,
      port: port,
      path: path,
      query: query,
      fragment: fragment
    });
  }

  static encodeComponent(string, regExp) {
    regExp = regExp || Uri.CHAR_CLASSES.RESERVED + Uri.CHAR_CLASSES.UNRESERVED;
    string = String(string);

    if (typeof regExp === 'string') {
      regExp = new RegExp('[^' + regExp + ']', 'g');
    }

    return string.replace(regExp, function encode(m) {
      var charCode = m[0].charCodeAt(0),
          encoded = [];

      if (charCode < 128) {
        encoded.push(charCode);
      }
      else if (charCode >= 128 && charCode < 2048) {
        encoded.push((charCode >> 6) | 192);
        encoded.push((charCode & 63) | 128);
      }
      else {
        encoded.push((charCode >> 12) | 224);
        encoded.push(((charCode >> 6) & 63) | 128);
        encoded.push((charCode & 63) | 128);
      }

      return encoded.map(function(c) {
        var encodedString = c.toString(16);

        while (encodedString.length < 2) {
          encodedString = '0' + encodedString;
        }

        return '%' + encodedString.toUpperCase();
      }).join('');
    });
  }
}

Uri.CHAR_CLASSES = {
  ALPHA: ALPHA,
  DIGIT: DIGIT,
  GEN_DELIMS: GEN_DELIMS,
  SUB_DELIMS: SUB_DELIMS,
  RESERVED: RESERVED,
  UNRESERVED: UNRESERVED,
  PCHAR: PCHAR,
  SCHEME: SCHEME,
  AUTHORITY: AUTHORITY,
  PATH: PATH,
  QUERY: QUERY,
  FRAGMENT: FRAGMENT
};

export default Uri;
