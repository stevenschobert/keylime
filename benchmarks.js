var keylime = require('./');
var _ = require('lodash');

var KeylimePost = keylime('KeylimePost')
    .attr('draft', true)
    .attr('title', '')
    .attr('tags', [])
    .attr('date', function createDate() {
      return Date.now();
    });

var HybridPost = keylime(function HybridPost(title, options) {
      this.keylime.init(this, options);
      this.title = title;
    })
    .attr('title', '')
    .attr('draft', true)
    .attr('tags', [])
    .attr('date', function() {
      return Date.now();
    });

var plainAttrs = {
  title: '',
  tags: [],
  draft: true,
  date: function createDate() {
    return Date.now();
  }
};

function BarePost(params) {
  this.title = params.title || '';
  this.tags = params.tags || [];
  this.draft = params.draft || true;
  this.date = params.date || Date.now();
}

function PlainPost(params) {
  var value;

  for (var attrName in plainAttrs) {
    if (plainAttrs.hasOwnProperty(attrName)) {
      if (params && params[attrName] !== undefined) {
        value = params[attrName];
      } else {
        value = plainAttrs[attrName];
      }

      if (typeof value === 'function') {
        this[attrName] = value();
      } else {
        this[attrName] = value;
      }
    }
  }
}

suite('creating instances with \'new\'', function() {
  bench('bare post', function() {
    new BarePost({title: 'New Post'});
  });

  bench('plain constructor', function() {
    new PlainPost({title: 'New Post'});
  });

  bench('keylime', function() {
    new KeylimePost({title: 'New Post'});
  });

  bench('hybrid', function() {
    new HybridPost('New Post');
  });
});
