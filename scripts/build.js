var fs = require('fs');
var exec = require('exec-sync');
var manifest = require('../package.json');
var mainFileContents = fs.readFileSync('./'+manifest.main, {encoding: 'utf-8'});

/**
 * Search through the main file to build up
 * a list of lodash functions that are used.
 */
var mainFileSearch = mainFileContents;
var lodashPattern = /_\.([^\s\(]+)[\s\(]/g;
var lodashSearchResults;
var lodashFunctions = [];

while ((lodashSearchResults = lodashPattern.exec(mainFileSearch)) !== null) {
  lodashFunctions.push(lodashSearchResults[1]);
  mainFileSearch = mainFileSearch.replace(new RegExp('_.'+lodashSearchResults[1], 'g'), '');
}

/**
 * Build out a custom version of lodash using the found
 * functions. This file will get cocated with the source
 * code to create a browser version.
 */
var includeList = lodashFunctions.join(',');
var lodashLocation = './node_modules/.bin/lodash';
var lodashFile = './tmp/lodash.js';
var commandFlags = [
  '-m',
  '-o '+ lodashFile,
  'exports=none',
  'iife="(function() { %output% _ = lodash; }())"',
].join(' ');
var lodashCommand = lodashLocation +' '+ commandFlags +' include='+ includeList;

console.log('Generating custom Lodash build using: \n' + lodashCommand + '\n');
exec(lodashCommand);

var compiledLodashFile = fs.readFileSync(lodashFile, {encoding: 'utf-8'});


/**
 * Separate out the main file's commonjs code
 * so that it can be packaged back up for browsers
 */
var keylimeSource = mainFileContents.split('// !!!---').slice(1, -1);


/**
 * Build a concat-ed file that captures dependencies
 * in a closure, and exports Keylime in AMD + Globals.
 */
var exportTop = [
'(function() {',
  'var _;'
].join('\n');
var exportBottom = [
  '(function (root, factory) {',
    'if (typeof define === \'function\' && define.amd) {',
      'define([], factory);',
    '} else {',
      'root.keylime = factory();',
    '}',
  '}(this, function() {',
    'return keylime;',
  '}));',
'}());'
].join('\n');
var concatedFile = exportTop + '\n\n' + compiledLodashFile + '\n\n' + keylimeSource + '\n\n' + exportBottom;


/**
 * Write out the concat-ed file to the dist directory
 */
var distPath = './dist/keylime.min.js';
var tmpPath = './tmp/keylime.js';

console.log('Writing out temporary file to '+tmpPath+'\n');
fs.writeFileSync(tmpPath, concatedFile, {encoding: 'utf-8'});


/**
 * Uglify the file
 */
var uglifyPath = './node_modules/.bin/uglifyjs';
var uglifyArgs = [
].join(' ');
var uglifyCommand = [uglifyPath, tmpPath, uglifyArgs, '-o ' + distPath].join(' ');

console.log('Uglifying ' + tmpPath + ' using:\n' + uglifyCommand + '\n');
exec(uglifyCommand);

console.log('Build complete!');
