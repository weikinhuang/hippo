define(function() {
  'use strict';

  var OP_RESERVED= /[+.\/\;?|!@]/,
      VARIABLE_REGEXP = new RegExp('{(' + OP_RESERVED.source + '?)(.+)}', 'g'),
      COMPONENTS_REGEXP = new RegExp('{(' + OP_RESERVED.source + '?)(.+)}');

  function processTemplate(templateMatch) {
    var split = templateMatch.match(COMPONENTS_REGEXP);

    return {
      original: split[0],
      op: split[1],
      key: split[2]
    };
  }

  function UriTemplate(template) {
    this._template = template;
  }

  UriTemplate.prototype.expand = function(variables) {
    var self = this,
        parsedTemplate = this._template;

    this._template.match(VARIABLE_REGEXP).forEach(function(match) {
      var processedMatch = processTemplate(match);

      switch(processedMatch.op) {
        case '?':
        case '+':
          break;
        default:
          parsedTemplate = parsedTemplate.replace(processedMatch.original, self.simpleExpansion(variables[processedMatch.key]));
      }
    });

    return parsedTemplate;
  };

  UriTemplate.prototype.simpleExpansion = function(value) {
    return escape(value);
  }

  return UriTemplate;
});
