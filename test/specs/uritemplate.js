define(['chai', 'uritemplate'], function(chai, UriTemplate) {
  'use strict';
  var expect = chai.expect;

  function generateTests(testcases, variables) {
    testcases.forEach(function(testcase) {
      var template = testcase[0],
          result = testcase[1];

      it('"' + template + '" expands to "' + result + '"', function() {
        var uri = new UriTemplate(template);

        expect(uri.expand(variables).toString()).to.equal(result);
      });
    });
  }

  describe('UrlTemplate', function() {
    describe('Level 1 Examples', function() {
      var variables = {
            var: "value",
            hello: "Hello World!"
          },
          testcases = [
            ["{var}", "value"],
            ["{hello}", "Hello%20World%21"]
          ];

      generateTests(testcases, variables);
    });

    describe('Level 2 Examples', function() {
      var variables = {
            var: "value",
            hello: "Hello World!",
            path: "/foo/bar"
          },
          testcases = [
            ["{+var}", "value"],
            ["{+hello}", "Hello%20World!"],
            ["{+path}/here", "/foo/bar/here"],
            ["here?ref={+path}", "here?ref=/foo/bar"]
          ];

      generateTests(testcases, variables);
    });

    describe('Level 3 Examples', function() {
      var variables = {
            var: "value",
            hello: "Hello World!",
            empty: "",
            path: "/foo/bar",
            x: "1024",
            y: "768"
          },
          testcases = [
            ["map?{x,y}", "map?1024,768"],
            ["{x,hello,y}", "1024,Hello%20World%21,768"],
            ["{+x,hello,y}", "1024,Hello%20World!,768"],
            ["{+path,x}/here", "/foo/bar,1024/here"],
            ["{#x,hello,y}", "#1024,Hello%20World!,768"],
            ["{#path,x}/here", "#/foo/bar,1024/here"],
            ["X{.var}", "X.value"],
            ["X{.x,y}", "X.1024.768"],
            ["{/var}", "/value"],
            ["{/var,x}/here", "/value/1024/here"],
            ["{;x,y}", ";x=1024;y=768"],
            ["{;x,y,empty}", ";x=1024;y=768;empty"],
            ["{?x,y}", "?x=1024&y=768"],
            ["{?x,y,empty}", "?x=1024&y=768&empty="],
            ["?fixed=yes{&x}", "?fixed=yes&x=1024"],
            ["{&x,y,empty}", "&x=1024&y=768&empty="]
          ];

      generateTests(testcases, variables);
    });
  });
});
