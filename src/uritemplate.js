define(['uri'], function(Uri) {
  'use strict';

  var VARIABLE_CHAR_CLASS = Uri.CHAR_CLASSES.ALPHA + Uri.CHAR_CLASSES.DIGIT + '_',
      ALL = Uri.CHAR_CLASSES.RESERVED + Uri.CHAR_CLASSES.UNRESERVED,
      VAR_CHAR = "(?:(?:[" + VARIABLE_CHAR_CLASS + "]|%[a-fA-F0-9][a-fA-F0-9])+)",
      RESERVED = "(?:[" + ALL + "]|%[a-fA-F0-9][a-fA-F0-9])",
      UNRESERVED = "(?:[#{" + UNRESERVED + "}]|%[a-fA-F0-9][a-fA-F0-9])",
      VARIABLE = "(?:" + VAR_CHAR + "(?:\\.?" + VAR_CHAR + ")*)",
      VARSPEC = "(?:(" + VARIABLE + ")(\\*|:\\d+)?)",
      OPERATOR = "+#./;?&=,!@|",

      //VARNAME_REGEXP = new RegExp("/^" + VARIABLE + "$"),
      VARSPEC_REGEXP = new RegExp("^" + VARSPEC + "$"),
      //VARIABLE_LIST_REGEXP = new RegExp("^" + VARSPEC + "(?:," + VARSPEC + ")*$"),
      EXPRESSION_REGEXP = new RegExp("{([" + OPERATOR + "])?(" + VARSPEC + "(?:," + VARSPEC + ")*)}"),
      G_EXPRESSION_REGEXP = new RegExp("{([" + OPERATOR + "])?(" + VARSPEC + "(?:," + VARSPEC + ")*)}", 'g'),

      LEADERS = ['?', '/', '#', '.', ';', '&'],
      JOINERS = {
        '?': '&',
        '.': '.',
        ';': ';',
        '&': '&',
        '/': '/'
      },

      DEFAULT_PROCESSOR = {
        '+': RESERVED + '*?',
        '#': RESERVED + '*?',
        '/': UNRESERVED + '*?',
        '.': UNRESERVED.replace(/\./g, '') + '*?',
        ';': UNRESERVED + '*=?' + UNRESERVED + '*?',
        '?': UNRESERVED + '*=' + UNRESERVED + '*?',
        '&': UNRESERVED + '*=' + UNRESERVED + '*?'
      };

  function escapeRegExp(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  }

  // ==== Match Data ====
  function MatchData(uri, template, mapping) {
    this.uri = uri;
    this.template = template;
    this.mapping = mapping;
    this.preMatch = "";
  }

  MatchData.prototype.variables = function() {
    return this.template.variables;
  };

  MatchData.prototype.values = function() {
    this.values = this.values || this.variables.reduce(function(accu, key) {
      accu.push(this.mapping[key]);
      return accu;
    }, []);
  };

  MatchData.prototype.valuesAt = function() {
    var indices = Array.prototype.slice(arguments);

    return indices.map(function(index) {
      this.get(index);
    }, this);
  };

  MatchData.prototype.get = function(key) {
    if (key) {
      return this.mapping[key];
    }

    return this.toMap();
  };

  MatchData.prototype.toMap = function() {
    return {
      uri: this.uri,
      values: this.values
    };
  };

  // ==== Template ====
  function Template(pattern) {
    this.pattern = pattern;
  }

  Template.prototype.expand = function(mapping, processor) {
    var self = this;

    return Uri.parse(this.pattern.replace(G_EXPRESSION_REGEXP, function(match) {
      return self._transform_match(mapping, match, processor);
    }));
  };

  Template.prototype.extract = function(uri, processor) {
    var matchData = this._match(uri, processor);
    return (matchData ? matchData.mapping : {});
  };

  Template.prototype._transform_match = function(mapping, match, processor) {
    var expressionPieces = match.match(EXPRESSION_REGEXP),
        operator = expressionPieces[1],
        varlist = expressionPieces[2],
        transformedMatch;

    transformedMatch = varlist.split(',')
    .reduce(function(acc, varspec) {
      var varspecPieces = varspec.match(VARSPEC),
          name = varspecPieces[1],
          modifier = varspecPieces[2],
          isComposite = modifier === '*',
          value = '' + mapping[name],
          allowReserved, encodeMap, transformedValue;

      if (value) {
        allowReserved = operator === '+' || operator === '#';

        if (!processor) {
          if (allowReserved) {
            encodeMap = Uri.CHAR_CLASSES.RESERVED +
                        Uri.CHAR_CLASSES.UNRESERVED;
          }
          else {
            encodeMap = Uri.CHAR_CLASSES.UNRESERVED;
          }

          if (Array.isArray(value)) {
            transformedValue = value.map(function(val) {
              Uri.encodeComponent(val, encodeMap);
            });

            if (isComposite) {
              transformedValue = transformedValue.join(',');
            }
          }
          else if (value instanceof Object) {
            transformedValue = Object.keys(value)
            .map(function (key) {
              var val = value[key],
                  kvPair = [
                    Uri.encodeComponent(key, encodeMap),
                    Uri.encodeComponent(val, encodeMap)
                  ];

              if (isComposite) {
                return kvPair.join('=');
              }
              else {
                return kvPair.join(',');
              }
            });

            if (!isComposite) {
              transformedValue = transformedValue.join(',');
            }
          }
          else {
            transformedValue = Uri.encodeComponent(value, encodeMap);
          }
        }
        else {
          if (processor.validate && !processor.validate(name, value)) {
            // TODO: Some sort of error should be thrown here, once we
            //       get to that point.
            return;
          }
          if (processor.transform) {
            transformedValue = processor.transform(name, value);
          }
        }

        acc.push({
          name: name,
          value: transformedValue
        });
      }

      return acc;
    }, []);

    if (!transformedMatch) {
      return '';
    }

    var thing = this._joinValues(operator, transformedMatch);

    return thing;
  };

  Template.prototype._joinValues = function(operator, values) {
    var leader = LEADERS[operator] || '',
        joiner = JOINERS[operator] || ',',
        joinedValues;

    switch(operator) {
      case '&':
      case '?':
        joinedValues = leader + values.map(function(kvPair) {
          if (Array.isArray(kvPair.value)) {
            if (/=/.test(kvPair.value[0])) {
              return kvPair.value.join(joiner);
            }
            else {
              return kvPair.value.map(function(val) {
                return kvPair.name + '=' + val;
              }).join(joiner);
            }
          }
          else {
            return kvPair.name + '=' + kvPair.value;
          }
        }).join(joiner);
        break;
      case ';':
        joinedValues = values.map(function(kvPair) {
          if (Array.isArray(kvPair.value)) {
            if (/=/.test(kvPair.value[0])) {
              return ';' + kvPair.value.join(';');
            }
            else {
              return ';' + kvPair.value.map(function(val) {
                return kvPair.name + '=' + val;
              }).join(';');
            }
          }
          else {
            return kvPair.value && kvPair.value !== '' ?
                   ';' + kvPair.name + '=' + kvPair.value :
                   ';' + kvPair.name;
          }
        }).join(joiner);
        break;
      default:
        joinedValues = leader + values.map(function(kvPair) {
          return kvPair.value;
        }).join(joiner);
    }

    return joinedValues;
  };

//  Template.prototype._match = function(uri, processor) {
//    uri = Uri.parse(uri);
//
//    var mapping = {};
//  };

  Template.prototype._parseTemplatePattern = function(pattern, processor) {
    var expansions = [],
        escapedPattern = escapeRegExp(pattern).replace(/\\\{(.*?)\\\}/g, function(match) {
          return match.replace(/\\(.)/g, '\\1');
        }),
        regexpString;

    regexpString = escapedPattern.replace(G_EXPRESSION_REGEXP, function(expansion) {
      var expansionPieces = expansion.match(EXPRESSION_REGEXP),
          operator = expansionPieces[1],
          varlist = expansionPieces[2],
          leader = escapeRegExp(LEADERS[operator] || ''),
          joiner = escapeRegExp(JOINERS[operator] || ','),
          combined;

      expansions.push(expansion);

      combined = varlist.split(',')
      .map(function valueCombinator(varspec) {
        var varspecPieces = varspec.match(VARSPEC_REGEXP),
            name = varspecPieces[1],
            modifier = varspecPieces[2],
            group;

        if (processor && processor.match) {
          return '(' + processor.match(name) + ')';
        }

        group = DEFAULT_PROCESSOR[operator] || UNRESERVED + '*?';
        return modifier === '*' ? '(' + group + '(?:' + joiner + '?' + group + ')*)?' : '(' + group + ')?';
      })
      .join(joiner + '?');

      return '(?:|' + leader + combined + ')';
    });

    regexpString = '^' + regexpString + '$';

    return {
      expansions: expansions,
      matcher: new RegExp(regexpString)
    };
  };


  // -- LEGACY --
  //function processTemplate(templateMatch) {
    //var split = templateMatch.match(COMPONENTS_REGEXP);

    //return {
      //original: split[0],
      //op: split[1],
      //key: split[2]
    //};
  //}

//  function UriTemplate(template) {
//    this._template = template;
//  }
//
//  UriTemplate.prototype.expand = function(variables) {
//    //var self = this,
//        //parsedTemplate = this._template;
//
//    //this._template.match(VARIABLE_REGEXP).forEach(function(match) {
//      //var processedMatch = processTemplate(match);
//
//      //switch(processedMatch.op) {
//        //case '?':
//        //case '+':
//          //break;
//        //default:
//          //parsedTemplate = parsedTemplate.replace(processedMatch.original, self.simpleExpansion(variables[processedMatch.key]));
//      //}
//    //});
//
//    //return parsedTemplate;
//  };
//
//  //UriTemplate.prototype.simpleExpansion = function(value) {
//    //return escape(value);
//  //}
//
//  return UriTemplate;
  return Template;
});
