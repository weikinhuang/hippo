var tests = [];

function toModuleName(filename) {
  return filename.replace('/base/', '').replace(/.js$/, '');
}

for (var file in window.__karma__.files) {
  if (window.__karma__.files.hasOwnProperty(file)) {
    if (/test\/specs\//.test(file)) {
      tests.push(toModuleName(file));
    }
  }
}

require({
  baseUrl: '/base'
}, tests, window.__karma__.start);

