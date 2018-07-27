const UglifyJS = require('uglify-es');
const files = require('./files');
const start = Date.now();
const result = {};
files.forEach(item => {
  const start = Date.now();
  UglifyJS.minify(item.content);
  result[item.file] = Date.now() - start;
});
console.error(result);
console.error('compress files', Date.now() - start);
