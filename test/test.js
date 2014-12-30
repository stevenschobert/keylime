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
      assert.equal(Sith.__proto__, keylime.core.KeylimeConstructor.prototype);
      assert(Sith.prototype.__keylime__ !== undefined);
    });

    it('should convert and existing function to Keylime', function() {
      function Sith() {}
      keylime(Sith);
      assert.equal(Sith.__proto__, keylime.core.KeylimeConstructor.prototype);
      assert(Sith.prototype.__keylime__ !== undefined);
    });
  });

  describe('core', function() {
    describe('#createNamedConstructor', function() {
      it('should set the function name using the first parameter', function() {
        var func = keylime.core.createNamedConstructor('Stormtrooper');
        assert.equal(func.name, 'Stormtrooper');
      });
    });

    describe('#convertConstructorToKeylime', function() {
      it('should change the prototype of the function to KeylimeConstructor', function() {
        function Jedi() {}
        keylime.core.convertConstructorToKeylime(Jedi);
        assert.equal(Jedi.__proto__, keylime.core.KeylimeConstructor.prototype);
      });

      it('should define a __keylime__ object on the constructor\'s prototype', function() {
        function Sith() {}
        keylime.core.convertConstructorToKeylime(Sith);
        assert(Sith.prototype.__keylime__ !== undefined);
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
    });
  });

  describe('KeylimeConstructor prototype', function() {
    it('should have it\'s prototype set to Function.prototype', function() {
      assert.equal(keylime.core.KeylimeConstructor.prototype.__proto__, Function.prototype);
    });

    describe('#getAttrs', function() {
      it('should return the constructor\'s attributes map', function() {
        var Blaster = keylime('Blaster');
        assert.equal(keylime.core.KeylimeConstructor.prototype.getAttrs.call(Blaster), Blaster.prototype.__keylime__.attrs);
      });
    });

    describe('#attr', function() {
      var Lightsaber;

      beforeEach(function() {
        Lightsaber = keylime('Lightsaber');
      });

      it('should add a property to the __keylime__.attrs', function() {
        Lightsaber.attr('color');
        assert(Lightsaber.prototype.__keylime__.attrs.color !== undefined);
      });

      it('should set a name property to the __keylime__.attrs entry', function() {
        Lightsaber.attr('power');
        assert.equal(Lightsaber.prototype.__keylime__.attrs.power.name, 'power');
      });

      it('should set a defaultValue property to the __keylime__.attrs entry', function() {
        Lightsaber.attr('power', 100);
        assert.equal(Lightsaber.prototype.__keylime__.attrs.power.defaultValue, 100);
      });

      it('should copy the remaining options properties to the attrs entry', function() {
        Lightsaber.attr('power', 100, { cloneDeep: true });
        assert.equal(Lightsaber.prototype.__keylime__.attrs.power.cloneDeep, true);
      });

      it('should set the default \'copyMode\' option to \'deep\'', function() {
        Lightsaber.attr('power', 100);
        assert.equal(Lightsaber.prototype.__keylime__.attrs.power.copyMode, 'deep');
      });
    });
  });

}());
