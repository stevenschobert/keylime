var keylime = require('./');
var _ = require('lodash');

var secureAttrs = function(model) {
  model._secureAttrs = null;

  model.attrHelper('hidden', function(attr) {
    model._secureAttrs = true;
    attr.secureAttrs = attr.secureAttrs || {};
    attr.secureAttrs.hidden = true;
  });

  model.attrHelper('locked', function(attr) {
    model._secureAttrs = true;
    attr.secureAttrs = attr.secureAttrs || {};
    attr.secureAttrs.locked = true;
  });

  model.attrInit(function(name, value, attr) {
    if (model._secureAttrs) {
      if (attr.secureAttrs) {
        delete this[name];
        Object.defineProperty(this, name, {
          value: value,
          enumerable: !attr.secureAttrs.hidden,
          configurable: !attr.secureAttrs.locked,
          writable: !attr.secureAttrs.locked
        });
      }
    }
  });
};

var secureAttrs2 = function(model) {
  model._secureAttrs = null;

  model.attrHelper('hidden', function(attr) {
    model._secureAttrs = true;
    attr.secureAttrs = attr.secureAttrs || {};
    attr.secureAttrs.hidden = true;
  });

  model.attrHelper('locked', function(attr) {
    model._secureAttrs = true;
    attr.secureAttrs = attr.secureAttrs || {};
    attr.secureAttrs.locked = true;
  });

  model.init(function() {
    var attr, value;
    if (model._secureAttrs) {
      for (var name in model.attrs()) {
        attr = model.attrs(name);
        if (attr.secureAttrs) {
          value = this[name];
          delete this[name];
          Object.defineProperty(this, name, {
            value: value,
            enumerable: !attr.secureAttrs.hidden,
            configurable: !attr.secureAttrs.locked,
            writable: !attr.secureAttrs.locked
          });
        }
      }
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

suite('attrInit plugin', function() {
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

suite('init plugin', function() {
  var Post = keylime('Post').attr('name', '');
  var Post2 = keylime('Post2').use(secureAttrs2).attr('name', '');
  var Post3 = keylime('Post3').use(secureAttrs2).attr('name', '').hidden();

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
