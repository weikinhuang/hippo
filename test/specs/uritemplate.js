import UriTemplate from 'src/uritemplate';

function generateTests(testcases, variables) {
  testcases.forEach(function([template, result]) {
    it(`"${template}" expands to "${result}"`, function() {
      var uri = new UriTemplate(template);

      if (Array.isArray(result)) {
        expect(result).toContain(uri.expand(variables).toString());
      }
      else {
        expect(uri.expand(variables).toString()).toEqual(result);
      }
    });
  });
}

describe('UrlTemplate', function() {
  describe('Level 1 Examples', function() {
    const variables = {
      var: 'value',
      hello: 'Hello World!'
    };
    const testcases = [
      ['{var}', 'value'],
      ['{hello}', 'Hello%20World%21']
    ];

    generateTests(testcases, variables);
  });

  describe('Level 2 Examples', function() {
    const variables = {
      var: 'value',
      hello: 'Hello World!',
      path: '/foo/bar'
    };
    const testcases = [
      ['{+var}', 'value'],
      ['{+hello}', 'Hello%20World!'],
      ['{+path}/here', '/foo/bar/here'],
      ['here?ref={+path}', 'here?ref=/foo/bar']
    ];

    generateTests(testcases, variables);
  });

  describe('Level 3 Examples', function() {
    const variables = {
      count: ['one', 'two', 'three'],
      dom: ['example', 'com'],
      dub: 'me/too',
      hello: 'Hello World!',
      half: '50%',
      var: 'value',
      who: 'fred',
      base: 'http://example.com/home/',
      path: '/foo/bar',
      list: ['red', 'green', 'blue'],
      keys: { semi: ';', dot: '.', comma: ',' },
      v: '6',
      x: '1024',
      y: '768',
      empty: '',
      empty_keys: [],
      undef: null
    };
    const testcases = [
      ['map?{x,y}', 'map?1024,768'],
      ['{x,hello,y}', '1024,Hello%20World%21,768'],
      ['{+x,hello,y}', '1024,Hello%20World!,768'],
      ['{+path,x}/here', '/foo/bar,1024/here'],
      ['{#x,hello,y}', '#1024,Hello%20World!,768'],
      ['{#path,x}/here', '#/foo/bar,1024/here'],
      ['X{.var}', 'X.value'],
      ['X{.x,y}', 'X.1024.768'],
      ['X{.empty}', 'X.'],
      ['X{.undef}', 'X'],
      ['X{.empty_keys}', 'X'],
      ['X{.empty_keys*}', 'X'],
      ['X{.undef}', 'X'],
      ['{/empty}', '/'],
      ['{/undef}', ''],
      ['{/var}', '/value'],
      ['{/var,x}/here', '/value/1024/here'],
      ['{;x,y}', ';x=1024;y=768'],
      ['{;x,y,empty}', ';x=1024;y=768;empty'],
      ['{?x,y}', '?x=1024&y=768'],
      ['{?x,y,empty}', '?x=1024&y=768&empty='],
      ['?fixed=yes{&x}', '?fixed=yes&x=1024'],
      ['{&x,y,empty}', '&x=1024&y=768&empty=']
    ];

    generateTests(testcases, variables);
  });

  describe('Level 4 Examples', function() {
    const variables = {
      var: 'value',
      hello: 'Hello World!',
      path: '/foo/bar',
      list: ['red', 'green', 'blue'],
      keys: { semi: ';', dot: '.', comma: ',' }
    };
    const testcases = [
      ['{var:3}', 'val'],
      ['{var:30}', 'value'],
      ['{list}', 'red,green,blue'],
      ['{list*}', 'red,green,blue'],
      ['{keys}', [
        'comma,%2C,dot,.,semi,%3B',
        'comma,%2C,semi,%3B,dot,.',
        'dot,.,comma,%2C,semi,%3B',
        'dot,.,semi,%3B,comma,%2C',
        'semi,%3B,comma,%2C,dot,.',
        'semi,%3B,dot,.,comma,%2C'
      ]],
      ['{keys*}', [
        'comma=%2C,dot=.,semi=%3B',
        'comma=%2C,semi=%3B,dot=.',
        'dot=.,comma=%2C,semi=%3B',
        'dot=.,semi=%3B,comma=%2C',
        'semi=%3B,comma=%2C,dot=.',
        'semi=%3B,dot=.,comma=%2C'
      ]],
      ['{+path:6}/here', '/foo/b/here'],
      ['{+list}', 'red,green,blue'],
      ['{+list*}', 'red,green,blue'],
      ['{+keys}', [
        'comma,,,dot,.,semi,;',
        'comma,,,semi,;,dot,.',
        'dot,.,comma,,,semi,;',
        'dot,.,semi,;,comma,,',
        'semi,;,comma,,,dot,.',
        'semi,;,dot,.,comma,,'
      ]],
      ['{+keys*}', [
        'comma=,,dot=.,semi=;',
        'comma=,,semi=;,dot=.',
        'dot=.,comma=,,semi=;',
        'dot=.,semi=;,comma=,',
        'semi=;,comma=,,dot=.',
        'semi=;,dot=.,comma=,'
      ]],
      ['{#path:6}/here', '#/foo/b/here'],
      ['{#list}', '#red,green,blue'],
      ['{#list*}', '#red,green,blue'],
      ['{#keys}', [
        '#comma,,,dot,.,semi,;',
        '#comma,,,semi,;,dot,.',
        '#dot,.,comma,,,semi,;',
        '#dot,.,semi,;,comma,,',
        '#semi,;,comma,,,dot,.',
        '#semi,;,dot,.,comma,,'
      ]],
      ['{#keys*}', [
        '#comma=,,dot=.,semi=;',
        '#comma=,,semi=;,dot=.',
        '#dot=.,comma=,,semi=;',
        '#dot=.,semi=;,comma=,',
        '#semi=;,comma=,,dot=.',
        '#semi=;,dot=.,comma=,'
      ]],
      ['X{.var:3}', 'X.val'],
      ['X{.list}', 'X.red,green,blue'],
      ['X{.list*}', 'X.red.green.blue'],
      ['X{.keys}', [
        'X.comma,%2C,dot,.,semi,%3B',
        'X.comma,%2C,semi,%3B,dot,.',
        'X.dot,.,comma,%2C,semi,%3B',
        'X.dot,.,semi,%3B,comma,%2C',
        'X.semi,%3B,comma,%2C,dot,.',
        'X.semi,%3B,dot,.,comma,%2C'
      ]],
      ['{/var:1,var}', '/v/value'],
      ['{/list}', '/red,green,blue'],
      ['{/list*}', '/red/green/blue'],
      ['{/list*,path:4}', '/red/green/blue/%2Ffoo'],
      ['{/keys}', [
        '/comma,%2C,dot,.,semi,%3B',
        '/comma,%2C,semi,%3B,dot,.',
        '/dot,.,comma,%2C,semi,%3B',
        '/dot,.,semi,%3B,comma,%2C',
        '/semi,%3B,comma,%2C,dot,.',
        '/semi,%3B,dot,.,comma,%2C'
      ]],
      ['{/keys*}', [
        '/comma=%2C/dot=./semi=%3B',
        '/comma=%2C/semi=%3B/dot=.',
        '/dot=./comma=%2C/semi=%3B',
        '/dot=./semi=%3B/comma=%2C',
        '/semi=%3B/comma=%2C/dot=.',
        '/semi=%3B/dot=./comma=%2C'
      ]],
      ['{;hello:5}', ';hello=Hello'],
      ['{;list}', ';list=red,green,blue'],
      ['{;list*}', ';list=red;list=green;list=blue'],
      ['{;keys}', [
        ';keys=comma,%2C,dot,.,semi,%3B',
        ';keys=comma,%2C,semi,%3B,dot,.',
        ';keys=dot,.,comma,%2C,semi,%3B',
        ';keys=dot,.,semi,%3B,comma,%2C',
        ';keys=semi,%3B,comma,%2C,dot,.',
        ';keys=semi,%3B,dot,.,comma,%2C'
      ]],
      ['{;keys*}', [
        ';comma=%2C;dot=.;semi=%3B',
        ';comma=%2C;semi=%3B;dot=.',
        ';dot=.;comma=%2C;semi=%3B',
        ';dot=.;semi=%3B;comma=%2C',
        ';semi=%3B;comma=%2C;dot=.',
        ';semi=%3B;dot=.;comma=%2C'
      ]],
      ['{?var:3}', '?var=val'],
      ['{?list}', '?list=red,green,blue'],
      ['{?list*}', '?list=red&list=green&list=blue'],
      ['{?keys}', [
        '?keys=comma,%2C,dot,.,semi,%3B',
        '?keys=comma,%2C,semi,%3B,dot,.',
        '?keys=dot,.,comma,%2C,semi,%3B',
        '?keys=dot,.,semi,%3B,comma,%2C',
        '?keys=semi,%3B,comma,%2C,dot,.',
        '?keys=semi,%3B,dot,.,comma,%2C'
      ]],
      ['{?keys*}', [
        '?comma=%2C&dot=.&semi=%3B',
        '?comma=%2C&semi=%3B&dot=.',
        '?dot=.&comma=%2C&semi=%3B',
        '?dot=.&semi=%3B&comma=%2C',
        '?semi=%3B&comma=%2C&dot=.',
        '?semi=%3B&dot=.&comma=%2C'
      ]],
      ['{&var:3}', '&var=val'],
      ['{&list}', '&list=red,green,blue'],
      ['{&list*}', '&list=red&list=green&list=blue'],
      ['{&keys}', [
        '&keys=comma,%2C,dot,.,semi,%3B',
        '&keys=comma,%2C,semi,%3B,dot,.',
        '&keys=dot,.,comma,%2C,semi,%3B',
        '&keys=dot,.,semi,%3B,comma,%2C',
        '&keys=semi,%3B,comma,%2C,dot,.',
        '&keys=semi,%3B,dot,.,comma,%2C'
      ]],
      ['{&keys*}', [
        '&comma=%2C&dot=.&semi=%3B',
        '&comma=%2C&semi=%3B&dot=.',
        '&dot=.&comma=%2C&semi=%3B',
        '&dot=.&semi=%3B&comma=%2C',
        '&semi=%3B&comma=%2C&dot=.',
        '&semi=%3B&dot=.&comma=%2C'
      ]]
    ];

    generateTests(testcases, variables);
  });
});
