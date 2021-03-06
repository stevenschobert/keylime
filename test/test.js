(function() {
  'use strict';

  var keylime = require('../');
  var assert = require('assert');

  describe('keylime function', function() {
    it('should create a named function', function() {
      var Jedi = keylime('Jedi');
      assert.equal(Jedi.name, 'Jedi');
    });

    it('should create a KeylimeConstructor function', function() {
      var Sith = keylime('Sith');
      assert(Sith instanceof keylime.prototypes.KeylimeConstructor);
      assert(Sith.prototype.keylime instanceof keylime.prototypes.KeylimeDescriptor);
      assert(Sith.descriptor instanceof keylime.prototypes.KeylimeDescriptor);
    });

    it('should convert and existing function to Keylime', function() {
      function Sith() {}
      keylime(Sith);
      assert(Sith instanceof keylime.prototypes.KeylimeConstructor);
      assert(Sith.prototype.keylime instanceof keylime.prototypes.KeylimeDescriptor);
      assert(Sith.descriptor instanceof keylime.prototypes.KeylimeDescriptor);
    });
  });

  describe('core', function() {
    describe('#createNamedConstructor', function() {
      it('should set the function name using the first parameter', function() {
        var func = keylime.core.createNamedConstructor('Stormtrooper');
        assert.equal(func.name, 'Stormtrooper');
      });

      it('should not allow calling without \'new\' keyword', function() {
        var func = keylime.core.createNamedConstructor('Stormtrooper');
        assert.throws(function() {
          func();
        }, /new|create/);
      });

      it('should call keylime.init when run', function() {
        var Func = keylime.core.createNamedConstructor('Stormtrooper');
        var called = 0;
        Func.prototype.keylime = {init: function() {++called; }};
        new Func();
        assert.equal(called, 1);
      });

      it('should skip calling keylime.init based on a second parameter', function() {
        var Func = keylime.core.createNamedConstructor('Stormtrooper', false);
        var called = 0;
        Func.prototype.keylime = {init: function() {++called; }};
        new Func();
        assert.equal(called, 0);
      });
    });

    describe('#convertConstructorToKeylime', function() {
      it('should change the prototype of the function to KeylimeConstructor', function() {
        function Jedi() {}
        keylime.core.convertConstructorToKeylime(Jedi);
        assert.equal(Jedi.__proto__, keylime.prototypes.KeylimeConstructor.prototype);
      });

      it('should define a KeylimeDescriptor on the constructor\'s prototype', function() {
        function Sith() {}
        keylime.core.convertConstructorToKeylime(Sith);
        assert(Sith.prototype.keylime instanceof keylime.prototypes.KeylimeDescriptor);
      });

      it('should define a KeylimeDescriptor on constructor', function() {
        function Sith() {}
        keylime.core.convertConstructorToKeylime(Sith);
        assert(Sith.descriptor instanceof keylime.prototypes.KeylimeDescriptor);
      });

      it('should set the descriptor attributes using an optional argument', function() {
        function Sith() {}
        keylime.core.convertConstructorToKeylime(Sith, {
          color: {
            color: 'color',
            defaultValue: 'blue'
          }
        });

        assert.deepEqual(Sith.descriptor.attributes, {
          color: {
            color: 'color',
            defaultValue: 'blue'
          }
        });
      });
    });

    describe('#setAttributesForInstance', function() {
      var Jedi;

      beforeEach(function() {
        Jedi = keylime(function Jedi() {}).attr('power', 100);
      });

      it('should set attributes based on the keylime map of passed in object', function() {
        var j = new Jedi();
        keylime.core.setAttributesForInstance(j);
        assert.equal(j.power, 100);
      });

      it('should pull attributes from an object argument', function() {
        var j = new Jedi();
        keylime.core.setAttributesForInstance(j, { power: 200, side: 'dark'});
        assert.equal(j.power, 200);
        assert(j.side === undefined);
      });

      it('should pull the Keylime constructor from an optional third argument', function() {
        var j = {};
        keylime.core.setAttributesForInstance(j, {}, Jedi);
        assert.equal(j.power, 100);
      });
    });

    describe('#setAttributesUsingMapAndValues', function() {
      var target;

      beforeEach(function() {
        target = {};
      });

      it('should not set a property not present in the map', function() {
        keylime.core.setAttributesUsingMapAndValues(target, {}, {color: 'blue'});
        assert.equal(target.color, undefined);
      });

      it('should set a property using the \'name\' key in the attributes map', function() {
        keylime.core.setAttributesUsingMapAndValues(target, { test: { name: 'color' }}, {color: 'blue'});
        assert.equal(target.color, 'blue');
      });

      it('should set an omited value using the \'defaultValue\' key in the attributes map', function() {
        keylime.core.setAttributesUsingMapAndValues(target, { test: { name: 'power', defaultValue: 100}});
        assert.equal(target.power, 100);
      });

      it('should set the property using the return value of \'defaultValue\', if it is a function', function() {
        var timesCreated = 0;
        keylime.core.setAttributesUsingMapAndValues(target, { test: { name: 'timesCreated', defaultValue: function() {
          return ++timesCreated;
        }}});
        assert.equal(target.timesCreated, 1);
      });

      it('should set the property using the return value of values key, if it is a function', function() {
        var timesCreated = 0;
        keylime.core.setAttributesUsingMapAndValues(target, { test: { name: 'timesCreated', defaultValue: undefined } }, {timesCreated: function() {
          return ++timesCreated;
        }});
        assert.equal(target.timesCreated, 1);
      });

      describe('copyMode option', function() {
        describe('deep', function() {
          it('should set the property using a deep copy of an object in the \'defaultValue\' key', function() {
            var obj = {one: 1, sub: {}};
            keylime.core.setAttributesUsingMapAndValues(target, {test: { name: 'testObj', defaultValue: obj, copyMode: 'deep' }});
            assert.notEqual(target.testObj, obj);
            assert.notEqual(target.testObj.sub, obj.sub);
            assert.deepEqual(target.testObj, obj);
          });

          it('should set the property using a deep copy of an array in the \'defaultValue\' key', function() {
            var arr = [1, {}];
            keylime.core.setAttributesUsingMapAndValues(target, {test: { name: 'testArr', defaultValue: arr, copyMode: 'deep' }});
            assert.notEqual(target.testArr, arr);
            assert.notEqual(target.testArr[1], arr[1]);
            assert.deepEqual(target.testArr, arr);
          });
        });

        describe('shallow', function() {
          it('should set the property using a shallow copy of an object in the \'defaultValue\' key', function() {
            var obj = {one: 1, sub: {}};
            keylime.core.setAttributesUsingMapAndValues(target, {test: { name: 'testObj', defaultValue: obj, copyMode: 'shallow' }});
            assert.notEqual(target.testObj, obj);
            assert.equal(target.testObj.sub, obj.sub);
            assert.deepEqual(target.testObj, obj);
          });

          it('should set the property using a shallow copy of an array in the \'defaultValue\' key', function() {
            var arr = [1, {}];
            keylime.core.setAttributesUsingMapAndValues(target, {test: { name: 'testArr', defaultValue: arr, copyMode: 'shallow' }});
            assert.notEqual(target.testArr, arr);
            assert.equal(target.testArr[1], arr[1]);
            assert.deepEqual(target.testArr, arr);
          });
        });

        describe('none', function() {
          it('should set the property using a reference of an object in the \'defaultValue\' key', function() {
            var obj = {one: 1, sub: {}};
            keylime.core.setAttributesUsingMapAndValues(target, {test: { name: 'testObj', defaultValue: obj, copyMode: 'none' }});
            assert.equal(target.testObj, obj);
          });

          it('should set the property using a reference copy of an array in the \'defaultValue\' key', function() {
            var arr = [1, {}];
            keylime.core.setAttributesUsingMapAndValues(target, {test: { name: 'testArr', defaultValue: arr, copyMode: 'none' }});
            assert.equal(target.testArr, arr);
          });
        });
      });

      describe('handlers', function() {
        it('should evaluate a single handler function', function() {
          var called = 0;
          var handler = function() { ++called; };
          keylime.core.setAttributesUsingMapAndValues(target, {test: { name: 'test', defaultValue: 2, handlers: handler}});
          assert.equal(called, 1);
        });

        it('should evaluate an array of handler functions', function() {
          var called = 0;
          var handler = function() { ++called; };
          keylime.core.setAttributesUsingMapAndValues(target, {test: { name: 'test', defaultValue: 2, handlers: [handler, handler, handler]}});
          assert.equal(called, 3);
        });

        it('should use the return value of the handler to determine the property of the target', function() {
          keylime.core.setAttributesUsingMapAndValues(target, {test: { name: 'test', defaultValue: 2, handlers: function() { return false; }}});
          assert.equal(target.test, false);
        });

        it('should pass the default value to the handler, if non is present on the target', function() {
          var capture = null;
          var handler = function(value) { capture = value;};
          keylime.core.setAttributesUsingMapAndValues(target, {test: { name: 'test', defaultValue: 2, handlers: handler}});
          assert.equal(capture, 2);
        });

        it('should pass the return value of the first handler to subsequent handlers', function() {
          var capture1 = null;
          var capture2 = null;
          var handler1 = function(value) { capture1 = value; return 3;};
          var handler2 = function(value) { capture2 = value;};
          keylime.core.setAttributesUsingMapAndValues(target, {test: { name: 'test', defaultValue: 2, handlers: [handler1, handler2]}});
          assert.equal(capture1, 2);
          assert.equal(capture2, 3);
        });

        it('should pass the target object\'s value to the handler', function() {
          var target = { test: 'new' };
          var capture = null;
          var handler = function(value) { capture = value; };
          keylime.core.setAttributesUsingMapAndValues(target, {test: { name: 'test', defaultValue: 'new', handlers: handler}});
          assert.equal(capture, 'new');
        });

        it('should pass the target object to the handler', function() {
          var capture = null;
          var handler = function(value, instance) { capture = instance; };
          keylime.core.setAttributesUsingMapAndValues(target, {test: { name: 'test', defaultValue: 'new', handlers: handler}});
          assert.equal(capture, target);
        });

        it('should pass the full attribute to the handler', function() {
          var capture = null;
          var handler = function(value, instance, attr) { capture = attr; };
          var attrMap = {test: {name: 'test', defaultValue: 'new', handlers: handler} };
          keylime.core.setAttributesUsingMapAndValues(target, attrMap);
          assert.equal(capture, attrMap.test);
        });
      });
    });
  });

  describe('KeylimeDescriptor prototype', function() {
    var k;

    beforeEach(function() {
      k = new keylime.prototypes.KeylimeDescriptor();
    });

    describe('#init', function() {
      it('should set attributes on a target object', function() {
        k.setAttr('color', 'blue');
        assert.equal(k.init({}).color, 'blue');
      });

      it('should overwrite attributes with an optional object parameter', function() {
        k.setAttr('side', 'dark').setAttr('power', 100);
        assert.deepEqual(k.init({}, {side: 'light'}), {
          side: 'light',
          power: 100
        });
      });

      it('should invoke the initializer function', function() {
        var called = 0;
        var handler = function() {++called;};
        k.initializers = handler;
        k.init({});
        assert.equal(called, 1);
      });

      it('should invoke multiple initializers', function() {
        var called = 0;
        var handler = function() {++called;};
        k.initializers = [handler, handler];
        k.init({});
        assert.equal(called, 2);
      });

      it('should pass the target to the initializer', function() {
        var target = {};
        var capture = null;
        var handler = function(ref) { capture = ref; };
        k.initializers = handler;
        k.init(target);
        assert.equal(capture, target);
      });
    });

    describe('#setAttr', function() {
      it('should add a property to the instance', function() {
        k.setAttr('color');
        assert(k.attributes.color !== undefined);
      });

      it('should set the attribute\'s name property using the name argument', function() {
        k.setAttr('power');
        assert.equal(k.attributes.power.name, 'power');
      });

      it('should set the attribute\'s defaultValue property using the second argument', function() {
        k.setAttr('power', 100);
        assert.equal(k.attributes.power.defaultValue, 100);
      });

      it('should copy the remaining options to the attribute\'s properties', function() {
        k.setAttr('power', 100, { extended: true });
        assert.equal(k.attributes.power.cloneDeep);
      });

      it('should return the instance', function() {
        assert.equal(k.setAttr('color'), k);
      });
    });

    describe('#getAttr', function() {
      it('should return the attribute descriptor for a given name', function() {
        k.setAttr('color', 'blue', { hex: '00f' });
        assert.deepEqual(k.getAttr('color'), {
          name: 'color',
          hex: '00f',
          defaultValue: 'blue'
        });
      });
    });

    describe('#addInitHandler', function() {
      it('should return the instance', function() {
        assert.equal(k.addInitHandler(function() {}), k);
      });

      it('should set the \'initializers\' property to the handler', function() {
        var handler = function() {};
        k.addInitHandler(handler);
        assert.equal(k.initializers, handler);
      });

      it('should convert the \'initializers\' to an array if already set', function() {
        k.initializers = function() {};
        k.addInitHandler(function() {});
        assert.equal(Object.prototype.toString.call(k.initializers), '[object Array]');
      });

      it('should append the handler to the end of the initializers array', function() {
        var handler = function() {};
        k.initializers = [function() {}];
        k.addInitHandler(handler);
        assert.equal(k.initializers[1], handler);
      });
    });

    describe('#removeInitHandler', function() {
      it('should set the \'initializers\' property to null if handler matches', function() {
        var handler = function() {};
        k.initializers = handler;
        k.removeInitHandler(handler);
        assert.deepEqual(k.initializers, null);
      });

      it('should not effect the \'initializers\' property if the handler doesn\'t match', function() {
        var handler1 = function() {};
        var handler2 = function() {};
        k.initializers = handler1;
        k.removeInitHandler(handler2);
        assert.equal(k.initializers, handler1);
      });

      it('should remove all occurances of the handler from the array', function() {
        var handler1 = function() {};
        var handler2 = function() {};
        k.initializers = [handler1, handler2, handler1];
        k.removeInitHandler(handler1);
        assert.deepEqual(k.initializers, [handler2]);
      });

      it('should set the \'initializers\' to null if no more matches are in the array', function() {
        var handler1 = function() {};
        var handler2 = function() {};
        k.initializers = [handler1, handler1];
        k.removeInitHandler(handler1);
        assert.deepEqual(k.initializers, null);
      });

      it('should return true if removed', function() {
        var handler = function() {};
        k.initializers = handler;
        assert.equal(k.removeInitHandler(handler), true);
      });

      it('should return false if not removed', function() {
        var handler = function() {};
        k.initializers = function() {};
        assert.equal(k.removeInitHandler(handler), false);
      });
    });

    describe('#removeAllInitHandlers', function() {
      it('should set the initializers to null', function() {
        k.initializers = function() {};
        k.removeAllInitHandlers();
        assert.deepEqual(k.initializers, null);
      });

      it('should return the handlers that were removed', function() {
        var handler = function() {};
        k.initializers = handler;
        assert.equal(k.removeAllInitHandlers(), handler);
      });
    });

    describe('#addAttrHandler', function() {
      it('should set the handlers property of the attribute', function() {
        var handler = function() {};
        k.setAttr('color', 'blue');
        k.addAttrHandler('color', handler);
        assert.equal(k.attributes.color.handlers, handler);
      });

      it('should throw an error if the attribute does not exist', function() {
        assert.throws(function() {k.addAttrHandler('blah', function() {});}, /found/);
      });

      it('should convert the handlers property to array if a handler is already set', function() {
        var handler = function() {};
        k.setAttr('color', 'blue', { handlers: handler });
        k.addAttrHandler('color', handler);
        assert(Array.isArray(k.attributes.color.handlers));
      });

      it('should append the handler to the end of the handlers array', function() {
        var handler1 = function() {};
        var handler2 = function() {};
        k.setAttr('color', 'blue', { handlers: handler1 });
        k.addAttrHandler('color', handler2);
        assert.deepEqual(k.attributes.color.handlers, [handler1, handler2]);
      });

      it('should return the instance', function() {
        k.setAttr('color', 'blue');
        assert.equal(k.addAttrHandler('color', function() {}), k);
      });
    });

    describe('#removeAttrHandler', function() {
      it('should set the handlers property to null if the handler matches', function() {
        var handler = function() {};
        k.setAttr('color', 'blue', { handlers: handler });
        k.removeAttrHandler('color', handler);
        assert.deepEqual(k.attributes.color.handlers, null);
      });

      it('should set the handlers to null if no more values in array', function() {
        var handler = function() {};
        k.setAttr('color', 'blue', { handlers: [handler] });
        k.removeAttrHandler('color', handler);
        assert.deepEqual(k.attributes.color.handlers, null);
      });

      it('should remove all occurances of the handler from the array', function() {
        var handler1 = function() {};
        var handler2 = function() {};
        k.setAttr('color', 'blue', { handlers: [handler1, handler2, handler1] });
        k.removeAttrHandler('color', handler1);
        assert.deepEqual(k.attributes.color.handlers, [handler2]);
      });

      it('should not affect handlers that don\'t match', function() {
        var handler1 = function() {};
        var handler2 = function() {};
        k.setAttr('color', 'blue', { handlers: handler1});
        k.removeAttrHandler('color', handler2);
        assert.equal(k.attributes.color.handlers, handler1);
      });

      it('should not affect handlers that don\'t match', function() {
        var handler1 = function() {};
        var handler2 = function() {};
        k.setAttr('color', 'blue', { handlers: [handler1]});
        k.removeAttrHandler('color', handler2);
        assert.deepEqual(k.attributes.color.handlers, [handler1]);
      });

      it('should return false if the handler was not removed', function() {
        var handler1 = function() {};
        var handler2 = function() {};
        k.setAttr('color', 'blue', { handlers: handler1});
        assert.equal(k.removeAttrHandler('color', handler2), false);
      });

      it('should return true if the handler was removed', function() {
        var handler = function() {};
        k.setAttr('color', 'blue', { handlers: handler });
        assert.equal(k.removeAttrHandler('color', handler), true);
      });
    });

    describe('#removeAllAttrHandlers', function() {
      it('should set the handlers of an attribute to null', function() {
        k.setAttr('color', 'blue', { handlers: function() {} });
        k.removeAllAttrHandlers('color');
        assert.deepEqual(k.attributes.color.handlers, null);
      });

      it('should return the handlers that were removed', function() {
        var handler = function() {};
        k.setAttr('color', 'blue', { handlers: handler });
        assert.equal(k.removeAllAttrHandlers('color'), handler);
      });
    });

    describe('#getDefaultFor', function() {
      it('should return the default value for an attribute by name', function() {
        k.setAttr('power', 100);
        assert.equal(k.getDefaultValueFor('power'), 100);
      });
    });
  });

  describe('KeylimeConstructor prototype', function() {
    var k;

    beforeEach(function() {
      k = new keylime.prototypes.KeylimeConstructor();
    });

    it('should be a type of function', function() {
      assert(k instanceof Function);
    });

    it('should have a KeylimeDescriptor', function() {
      assert(k.descriptor instanceof keylime.prototypes.KeylimeDescriptor);
    });

    it('should set a reference to the descriptor on it\'s prototype as \'keylime\'', function() {
      assert.equal(k.prototype.keylime, k.descriptor);
    });

    describe('#getAttrs', function() {
      it('should return the descriptor\'s attributes', function() {
        assert.equal(k.getAttrs(), k.descriptor.attributes);
      });
    });

    describe('#attr', function() {
      it('should set the default \'copyMode\' option to \'deep\'', function() {
        k.attr('power', 100);
        assert.equal(k.descriptor.attributes.power.copyMode, 'deep');
      });

      it('should set the default \'handlers\' to null', function() {
        k.attr('power', 100);
        assert.deepEqual(k.descriptor.attributes.power.handlers, null);
      });

      it('should return the same constructor for chaining', function() {
        assert.equal(k.attr('test'), k);
      });
    });

    describe('#method', function() {
      it('should use the \'name\' parameter to extend the prototype object', function() {
        k.method('test', function() {});
        assert(k.prototype.test !== undefined);
      });

      it('should add the \'function\' parameter to the prototype', function() {
        assert.equal(k.method('test', function() {}), k);
      });
    });

    describe('#include', function() {
      it('should return the same constructor for chaining', function() {
        assert.equal(k.include(function() {}), k);
      });

      it('should invoke the function passed to the include', function() {
        var called = 0;
        var mixin = function() {++called;};
        k.include(mixin);
        assert.equal(called, 1);
      });

      it('should pass the constructor to the include function', function() {
        var capture = null;
        var mixin = function(constructor) {capture = constructor;};
        k.include(mixin);
        assert.equal(k, capture);
      });

      it('should pass the remaining arguments to the include function', function() {
        var capture = null;
        var mixin = function(constructor, other) {capture = other;};
        k.include(mixin, 'test');
        assert.equal(capture, 'test');
      });
    });

    describe('#create', function() {
      beforeEach(function() {
        k = keylime('Jedi');
        k.attr('name').attr('age', 10);
      });

      it('should return an instance of the constructor\'s prototype', function() {
        var i = k.create();
        assert.equal(i.__proto__, k.prototype);
      });

      it('should apply override attributes', function() {
        var i = k.create({name: 'obi wan'});
        assert.equal(i.name, 'obi wan');
      });

      it('should apply default attributes', function() {
        var i = k.create();
        assert.equal(i.age, 10);
      });

      it('should invoke the constructor function', function() {
        var called = 0;
        k = keylime(function() { ++called; });
        k.create();
        assert.equal(called, 1);
      });

      it('should pass any arguments passed to create to the function', function() {
        var capture = null;
        k = keylime(function(arg) { capture = arg; });
        k.create(1);
        assert.equal(capture, 1);
      });
    });

    describe('#on', function() {
      describe('init', function() {
        it('should return the same constructor for chaining', function() {
          k.attr('name');
          assert.equal(k.on('attr:name', function() {}), k);
        });

        it('should add the handler to the descriptors initializers', function() {
          var handler = function() {};
          k.on('init', handler);
          assert.equal(k.descriptor.initializers, handler);
        });
      });

      describe('attr', function() {
        it('should return the same constructor for chaining', function() {
          k.attr('name');
          assert.equal(k.on('attr', 'name', function() {}), k);
        });

        it('should set an attribute handler', function() {
          var handler = function() {};
          k.attr('name');
          k.on('attr', 'name', handler);
          assert.equal(k.descriptor.attributes.name.handlers, handler);
        });
      });
    });

    describe('#off', function() {
      describe('attr', function() {
        it('should remove a specific attribute handler', function() {
          var handler1 = function() {};
          var handler2 = function() {};
          k.attr('name').on('attr', 'name', handler1).on('attr', 'name', handler2);
          k.off('attr', 'name', handler2);
          assert.deepEqual(k.descriptor.attributes.name.handlers, [handler1]);
        });
      });

      describe('init', function() {
        it('should remove a specific handler from the initializers', function() {
          var handler1 = function() {};
          var handler2 = function() {};
          k.on('init', handler1).on('init', handler2);
          k.off('init', handler2);
          assert.deepEqual(k.descriptor.initializers, [handler1]);
        });
      });
    });

    describe('#offAny', function() {
      describe('attr', function() {
        it('should remove all attribute handlers', function() {
          var handler1 = function() {};
          var handler2 = function() {};
          k.attr('name').on('attr', 'name', handler1).on('attr', 'name', handler2);
          k.offAny('attr', 'name');
          assert.deepEqual(k.descriptor.attributes.name.handlers, null);
        });
      });

      describe('init', function() {
        it('should remove all handlers from the initializers', function() {
          var handler1 = function() {};
          var handler2 = function() {};
          k.on('init', handler1).on('init', handler2);
          k.offAny('init');
          assert.deepEqual(k.descriptor.initializers, null);
        });
      });
    });
  });
}());
