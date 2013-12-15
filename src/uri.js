define(function() {
  'use strict';

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

  function trim(str) {
    return str.replace(/^\s+|\s+$/g, '');
  }

  function Uri(components) {
    components = components || {};

    this.protocol = components.protocol || '';
    this.user = components.user || '';
    this.password = components.password || '';
    this.host = components.host || '';
    this.port = components.port || '';
    this.path = components.path || '';
    this.query = components.query || '';
    this.fragment = components.fragment || '';
  }

  Uri.prototype.userInfo = function() {
    return [
      this.user,
      (this.password ? ':' + this.password : '')
    ].join('');
  };

  Uri.prototype.authority = function() {
    return [
      (this.user ? this.userInfo() + '@' : ''),
      this.host,
      (this.port ? ':' + this.port : '')
    ].join('');
  };

  Uri.prototype.site = function() {
    return [
      (this.protocol ? this.protocol + '://' : ''),
      this.authority(),
    ].join('');
  };

  Uri.prototype.isRelative = function() {
    return !!this.protocol;
  };

  Uri.prototype.isAbsolute = function() {
    return !this.isRelative();
  };

  Uri.prototype.toString = function() {
    return [
      (this.protocol ? this.protocol + '://' : ''),
      this.authority(),
      this.path,
      (this.query ? '?' + this.query : ''),
      (this.fragment ? '#' + this.fragment : '')
    ].join('');
  };

  Uri.parse = function(uri) {
    if (!uri) { return new Uri(); }

    var uriPieces = uri.match(new RegExp(URIREGEX)),
        protocol = uriPieces[1],
        authority = uriPieces[2],
        path = uriPieces[3],
        query = uriPieces[4],
        fragment = uriPieces[5],
        user, password, host, port, userInfo;

    if (authority) {
      userInfo = authority.match(/^([^\[\]]*)@/)[1];

      if (userInfo) {
        user = trim(userInfo).match(/^([^:]*):?/)[1];
        password = trim(userInfo).match(/:(.*)$/)[1];
      }

      port = authority.match(/:([^:@\[\]]*?)$/)[1];

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
  };

  Uri.encodeComponent = function(string, regExp) {
    regExp = regExp || /\W/g;
    string = '' + string;

    return string.replace(regExp, function (m) {
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
        return '%' + c.toString(16).toUpperCase();
      }).join('');
    });
  };

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

  return Uri;
});
