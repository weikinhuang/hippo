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
  });
});
