import Uri from './uri';

const VARIABLE_CHAR_CLASS = Uri.CHAR_CLASSES.ALPHA + Uri.CHAR_CLASSES.DIGIT + '_';
const ALL = Uri.CHAR_CLASSES.RESERVED + Uri.CHAR_CLASSES.UNRESERVED;
const VAR_CHAR = "(?:(?:[" + VARIABLE_CHAR_CLASS + "]|%[a-fA-F0-9][a-fA-F0-9])+)";
const RESERVED = "(?:[" + ALL + "]|%[a-fA-F0-9][a-fA-F0-9])";
const UNRESERVED = "(?:[#{" + UNRESERVED + "}]|%[a-fA-F0-9][a-fA-F0-9])"; // eslint-disable-line no-use-before-define
const VARIABLE = "(?:" + VAR_CHAR + "(?:\\.?" + VAR_CHAR + ")*)";
const VARSPEC = "(?:(" + VARIABLE + ")(\\*|:\\d+)?)";
const OPERATOR = "+#./;?&=,!@|";

const VARSPEC_REGEXP = new RegExp("^" + VARSPEC + "$");
const EXPRESSION_REGEXP = new RegExp("{([" + OPERATOR + "])?(" + VARSPEC + "(?:," + VARSPEC + ")*)}");
const G_EXPRESSION_REGEXP = new RegExp("{([" + OPERATOR + "])?(" + VARSPEC + "(?:," + VARSPEC + ")*)}", 'g');

const LEADERS = {
  '?': '?',
  '/': '/',
  '#': '#',
  '.': '.',
  ';': ';',
  '&': '&'
};
const JOINERS = {
  '?': '&',
  '.': '.',
  ';': ';',
  '&': '&',
  '/': '/'
};

const DEFAULT_PROCESSOR = {
  '+': RESERVED + '*?',
  '#': RESERVED + '*?',
  '/': UNRESERVED + '*?',
  '.': UNRESERVED.replace(/\./g, '') + '*?',
  ';': UNRESERVED + '*=?' + UNRESERVED + '*?',
  '?': UNRESERVED + '*=' + UNRESERVED + '*?',
  '&': UNRESERVED + '*=' + UNRESERVED + '*?'
};

    // Caching commonly used applied functions
const concat = Array.prototype.concat;

function escapeRegExp(s) {
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

// ==== Match Data ====
export class MatchData {
  constructor(uri, template, mapping) {
    this.uri = uri;
    this.template = template;
    this.mapping = mapping;
    this.preMatch = "";
  }

  variables() {
    return this.template.variables;
  }

  values() {
    this.values = this.values || this.variables.reduce(function(accu, key) {
      accu.push(this.mapping[key]);
      return accu;
    }, []);
  }

  valuesAt(...indices) {
    return indices.map(function(index) {
      this.get(index);
    }, this);
  }

  get(key) {
    if (key) {
      return this.mapping[key];
    }

    return this.toMap();
  }

  toMap() {
    return {
      uri: this.uri,
      values: this.values
    };
  }
}

// ==== Template ====
export default class Template {
  constructor(pattern) {
    this.pattern = pattern;
  }

  expand(mapping, processor) {
    return Uri.parse(this.pattern.replace(G_EXPRESSION_REGEXP, (match) => {
      return this._transformMatch(mapping, match, processor);
    }));
  };

  _transformMatch(mapping, match, processor) {
    const [, operator, varList] = match.match(EXPRESSION_REGEXP);

    const transformedMatch = varList.split(',')
    .reduce(function(acc, varspec) {
      const [, name, modifier] = varspec.match(VARSPEC);
      const isComposite = modifier === '*';
      const prefix = /^:\d+/.test(modifier) ? modifier.replace(':', '') : '';
      const value = mapping[name];
      let encodeMap;
      let transformedValue;

      if (value !== null && typeof value !== 'undefined' && !(Array.isArray(value) && value.length === 0)) {
        let allowReserved = operator === '+' || operator === '#';

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
              if (prefix) {
                return Uri.encodeComponent(val.slice(0, prefix), encodeMap);
              }
              else {
                return Uri.encodeComponent(val, encodeMap);
              }
            });

            if (!isComposite) {
              transformedValue = transformedValue.join(',');
            }
          }
          else if (value instanceof Object) {
            transformedValue = Object.keys(value)
            .map(function(key) {
              const val = value[key];
              const kvPair = [
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
            if (prefix) {
              transformedValue = Uri.encodeComponent(value.slice(0, prefix), encodeMap);
            }
            else {
              transformedValue = Uri.encodeComponent(value, encodeMap);
            }
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
          name,
          value: transformedValue
        });
      }

      return acc;
    }, []);

    if (!transformedMatch || transformedMatch.length === 0) {
      return '';
    }

    return this._joinValues(operator, transformedMatch);
  };

  _joinValues(operator, values) {
    const leader = LEADERS[operator] || '';
    const joiner = JOINERS[operator] || ',';
    let joinedValues;

    switch (operator) {
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
        }).join('');
        break;
      default:
        joinedValues = leader + concat.apply([], values.map(function(kvPair) {
          return kvPair.value;
        })).join(joiner);
    }

    return joinedValues;
  };

  _parseTemplatePattern(pattern, processor) {
    const expansions = [];
    const escapedPattern = escapeRegExp(pattern).replace(/\\\{(.*?)\\\}/g, function(match) {
      return match.replace(/\\(.)/g, '\\1');
    });

    const regexpString = escapedPattern.replace(G_EXPRESSION_REGEXP, function(expansion) {
      const [, operator, varList] = expansion.match(EXPRESSION_REGEXP);
      const leader = escapeRegExp(LEADERS[operator] || '');
      const joiner = escapeRegExp(JOINERS[operator] || ',');

      expansions.push(expansion);

      const combined = varList.split(',')
      .map(function valueCombinator(varspec) {
        const [, name, modifier] = varspec.match(VARSPEC_REGEXP);

        if (processor && processor.match) {
          return '(' + processor.match(name) + ')';
        }

        const group = DEFAULT_PROCESSOR[operator] || UNRESERVED + '*?';
        return modifier === '*' ? '(' + group + '(?:' + joiner + '?' + group + ')*)?' : '(' + group + ')?';
      })
      .join(joiner + '?');

      return '(?:|' + leader + combined + ')';
    });

    return {
      expansions,
      matcher: new RegExp('^' + regexpString + '$')
    };
  };
}
