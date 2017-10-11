const fs = require('fs');

let core = null;
try {
  fs.accessSync(__dirname + '/lib/index.js', fs.R_OK);
  core = require('./lib');
  if (!global._babelPolyfill) {
    require('babel-polyfill');
  }
} catch (e) {
  core = require('./src');
}

exports = module.exports = core;
