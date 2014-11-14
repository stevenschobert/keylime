var keylime = require('./');
var _ = require('lodash');

var secureAttrs = function(model) {
  model.attrHelper('hidden', function(attr) {
    attr.secureAttrs = attr.secureAttrs || {};
    attr.secureAttrs.hidden = true;
  });

  model.attrHelper('locked', function(attr) {
    attr.secureAttrs = attr.secureAttrs || {};
    attr.secureAttrs.locked = true;
  });

  model.attrInit(function(name, value, attr) {
    if (attr.secureAttrs) {
      delete this[name];
      Object.defineProperty(this, name, {
        value: value,
        enumerable: !attr.secureAttrs.hidden,
        configurable: !attr.secureAttrs.locked,
        writable: !attr.secureAttrs.locked
      });
    }
  });
};


suite('.init', function() {
  var Post = keylime('Post').attr('name', '');
  var Post2 = keylime('Post2').attr('name', '').init(function() {});
  var Post3 = keylime('Post3').attr('name', '').init(function() {}).init(function() {}).init(function() {});

  bench('with 0 initers', function() {
    new Post({name: 'test'});
  });

  bench('with 1 initers', function() {
    new Post2({name: 'test'});
  });

  bench('with 3 initers', function() {
    new Post3({name: 'test'});
  });
});

suite('.attrInit', function() {
  var Post = keylime('Post').attr('name', '').attr('steven');
  var Post2 = keylime('Post2').attr('name', '').attr('steven').attrInit(function() {});
  var Post3 = keylime('Post3').attr('name', '').attr('steven').attrInit(function() {}).attrInit(function() {}).attrInit(function() {});
  var Post4 = keylime('Post4').attr('name', '').attr('steven').attrInit(function() {}).attrInit(function() {}).attrInit(function() {}).attrInit(function() {}).attrInit(function() {});

  bench('with 0 initers', function() {
    new Post({name: 'test'});
  });

  bench('with 1 initers', function() {
    new Post2({name: 'test'});
  });

  bench('with 3 initers', function() {
    new Post3({name: 'test'});
  });

  bench('with 5 initers', function() {
    new Post4({name: 'test'});
  });
});

suite('plugin', function() {
  var Post = keylime('Post').attr('name', '');
  var Post2 = keylime('Post2').use(secureAttrs).attr('name', '');
  var Post3 = keylime('Post3').use(secureAttrs).attr('name', '').hidden();

  bench('with no plugin', function() {
    new Post({name: 'test'});
  });

  bench('with unused plugin', function() {
    new Post2({name: 'test'});
  });

  bench('with used plugin', function() {
    new Post3({name: 'test'});
  });
});
