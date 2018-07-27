const helper = require('think-helper');
const path = require('path');
const rootPath = path.join(__dirname, '../node_modules');
const fs = require('fs');
const files = helper.getdirFiles(rootPath).filter(item => {
  return item.endsWith('.js') && item.indexOf('/node_modules/') === -1 && item.indexOf('/test/') === -1;
}).slice(0, 1000).map(file => {
  return {
    file,
    content: fs.readFileSync(path.join(rootPath, file), 'utf8')
  };
});
module.exports = files;
