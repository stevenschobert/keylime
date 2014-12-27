var keylime = require('./');
var _ = require('lodash');

var KeylimePost = keylime('KeylimePost');
  //.attr('title', '')
  //.attr('data', function createDate() {
  //  return Date.now();
  //});

function PlainPost(params) {
  //var attrs = {
  //  title: '',
  //  date: function createDate() {
  //    return Date.now();
  //  }
  //};
  //params = params || {};

  //var sanitizedParams = {};

  //for (var attrName in attrs) {
  //  if (attrs.hasOwnProperty(attrName)) {
  //    if (params[attrName] !== undefined) {
  //      sanitizedParams[attrName] = params[attrName];
  //    } else {
  //      sanitizedParams[attrName] = attrs[attrName];
  //    }
  //  }
  //}

  //for (var sanParamName in sanitizedParams) {
  //  if (sanitizedParams.hasOwnProperty(sanParamName)) {
  //    if (typeof sanitizedParams[sanParamName] === 'function') {
  //      this[sanParamName] = sanitizedParams[sanParamName]();
  //    } else {
  //      this[sanParamName] = sanitizedParams[sanParamName];
  //    }
  //  }
  //}
}

suite('creating instances with \'new\'', function() {
  bench('keylime', function() {
    new KeylimePost();
  });

  bench('plain constructor', function() {
    new PlainPost();
  });
});

