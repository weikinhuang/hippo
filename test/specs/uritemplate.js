define(['chai', 'uritemplate'], function(chai, UriTemplate) {
  'use strict';
  var expect = chai.expect;

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

      testcases.forEach(function(testcase) {
        var template = testcase[0],
            result = testcase[1];

        it('"' + template + '" expands to "' + result + '"', function() {
          var uri = new UriTemplate(template);
          expect(uri.expand(variables)).to.equal(result);
        });
      });
    });
  });
});
