const ALPHA = 'a-zA-Z';
const DIGIT = '0-9';
const GEN_DELIMS = "\\:\\/\\?\\#\\[\\]\\@"; // eslint-disable-line quotes
const SUB_DELIMS = "\\!\\$\\&\\'\\(\\)\\*\\+\\,\\;\\="; // eslint-disable-line quotes
const RESERVED = GEN_DELIMS + SUB_DELIMS;
const UNRESERVED = ALPHA + DIGIT + "\\-\\.\\_\\~"; // eslint-disable-line quotes
const PCHAR = UNRESERVED + SUB_DELIMS + "\\:\\@"; // eslint-disable-line quotes
const SCHEME = ALPHA + DIGIT + "\\-\\+\\."; // eslint-disable-line quotes
const AUTHORITY = PCHAR;
const PATH = PCHAR + "\\/"; // eslint-disable-line quotes
const QUERY = PCHAR + "\\/\\?"; // eslint-disable-line quotes
const FRAGMENT = PCHAR + "\\/\\?"; // eslint-disable-line quotes
const URIREGEX = /^(?:([^:\/?#]+):)?(?:\/\/([^\/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?$/;

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

    const uriPieces = uri.match(new RegExp(URIREGEX));
    const protocol = uriPieces[1];
    const authority = uriPieces[2];
    const path = uriPieces[3];
    const query = uriPieces[4];
    const fragment = uriPieces[5];
    let user;
    let password;
    let host;
    let port;

    if (authority) {
      let userInfo = scan(authority, /^([^\[\]]*)@/, 1);

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
      protocol,
      user,
      password,
      host,
      port,
      path,
      query,
      fragment
    });
  }

  static encodeComponent(string, regExp) {
    regExp = regExp || Uri.CHAR_CLASSES.RESERVED + Uri.CHAR_CLASSES.UNRESERVED;
    string = String(string);

    if (typeof regExp === 'string') {
      regExp = new RegExp('[^' + regExp + ']', 'g');
    }

    return string.replace(regExp, function encode(m) {
      const charCode = m[0].charCodeAt(0);
      const encoded = [];

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
  ALPHA,
  DIGIT,
  GEN_DELIMS,
  SUB_DELIMS,
  RESERVED,
  UNRESERVED,
  PCHAR,
  SCHEME,
  AUTHORITY,
  PATH,
  QUERY,
  FRAGMENT
};
