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

  describe('utilities', function() {

    describe('#createNamedConstructor', function() {
      it('should set the function name using the first parameter', function() {
        var func = keylime.util.createNamedConstructor('Stormtrooper');
        assert.equal(func.name, 'Stormtrooper');
      });
    });

    describe('#convertConstructorToKeylime', function() {
      it('should change the prototype of the function to KeylimeConstructor', function() {
        function Jedi() {}
        keylime.util.convertConstructorToKeylime(Jedi);
        assert.equal(Jedi.__proto__, keylime.core.KeylimeConstructor.prototype);
      });

      it('should define a __keylime__ object on the constructor\'s prototype', function() {
        function Sith() {}
        keylime.util.convertConstructorToKeylime(Sith);
        assert(Sith.prototype.__keylime__ !== undefined);
      });
    });

    describe('#setAttributesUsingMapAndValues', function() {
      it('should not set a property not present in the map', function() {
        var target = {};
        keylime.util.setAttributesUsingMapAndValues(target, {}, {color: 'blue'});
        assert.equal(target.color, undefined);
      });

      it('should set a property using the \'name\' key in the attributes map', function() {
        var target = {};
        keylime.util.setAttributesUsingMapAndValues(target, { test: { name: 'color' }}, {color: 'blue'});
        assert.equal(target.color, 'blue');
      });

      it('should set an omited value using the \'defaultValue\' key in the attributes map', function() {
        var target = {};
        keylime.util.setAttributesUsingMapAndValues(target, { test: { name: 'power', defaultValue: 100}});
        assert.equal(target.power, 100);
      });

      it('should set the property using the return value of \'defaultValue\', if it is a function', function() {
        var target = {};
        var timesCreated = 0;
        keylime.util.setAttributesUsingMapAndValues(target, { test: { name: 'timesCreated', defaultValue: function() {
          return ++timesCreated;
        }}});
        assert.equal(target.timesCreated, 1);
      });

      it('should set the property using the return value of values key, if it is a function', function() {
        var target = {};
        var timesCreated = 0;
        keylime.util.setAttributesUsingMapAndValues(target, { test: { name: 'timesCreated', defaultValue: undefined } }, {timesCreated: function() {
          return ++timesCreated;
        }});
        assert.equal(target.timesCreated, 1);
      });
    });

    describe('#clone', function() {
      it('should return values for booleans', function() {
        assert.equal(keylime.util.clone(true), true);
        assert.equal(typeof keylime.util.clone(true), 'boolean');
      });

      it('should return values for numbers', function() {
        assert.equal(keylime.util.clone(2), 2);
        assert.equal(typeof keylime.util.clone(2), 'number');
      });

      it('should return values for strings', function() {
        assert.equal(keylime.util.clone('test'), 'test');
        assert.equal(typeof keylime.util.clone('test'), 'string');
      });

      it('should copy boolean objects', function() {
        /* jshint -W053 */
        var bool = new Boolean(true);
        assert.notEqual(bool, keylime.util.clone(bool));
        assert.equal(bool.valueOf(), keylime.util.clone(bool).valueOf());
      });

      it('should copy string objects', function() {
        /* jshint -W053 */
        var testStr = new String('test');
        assert.notEqual(testStr, keylime.util.clone(testStr));
        assert.equal(testStr.valueOf(), keylime.util.clone(testStr).valueOf());
      });

      it('should copy number objects', function() {
        /* jshint -W053 */
        var testNum = new Number(2);
        assert.notEqual(testNum, keylime.util.clone(testNum));
        assert.equal(testNum.valueOf(), keylime.util.clone(testNum).valueOf());
      });

      it('should copy regexp objects', function() {
        var testRegex = new RegExp('hello.*', 'i');
        var cloned = keylime.util.clone(testRegex);
        assert.notEqual(testRegex, cloned);
        assert.equal(testRegex.toString(), cloned.toString());
      });

      it('should copy date objects', function() {
        var testDate = new Date();
        var cloned = keylime.util.clone(testDate);
        assert.notEqual(testDate, cloned);
        assert.equal(testDate.toString(), cloned.toString());
      });

      it('should copy custom objects', function() {
        function Droid(model) { this.model = model; }
        var c3po = new Droid('protocol');
        var cloned = keylime.util.clone(c3po);
        assert.notEqual(cloned, c3po);
        assert.deepEqual(cloned, c3po);
        assert(cloned instanceof Droid);
      });

      it('should copy object keys', function() {
        var testObj = { one: 1, two: 'two' };
        assert.notEqual(keylime.util.clone(testObj), testObj);
        assert.deepEqual(keylime.util.clone(testObj), testObj);
      });

      it('should copy objects with deep copying', function() {
        var testObj1 = { test: 'test' };
        var testObj2 = { one: testObj1 };
        var cloned = keylime.util.clone(testObj2, true);
        assert.notEqual(cloned.one, testObj1);
        assert.deepEqual(cloned.one, testObj1);
      });

      it('should copy array values', function() {
        var testArr = [ 'one', 2 ];
        assert.notEqual(keylime.util.clone(testArr), testArr);
        assert.deepEqual(keylime.util.clone(testArr), testArr);
      });

      it('should copy array values with deep copying', function() {
        var testObj1 = { test: 'test' };
        var testArr = [ testObj1, 2 ];
        var cloned = keylime.util.clone(testArr, true);
        assert.notEqual(cloned[0], testObj1);
        assert.deepEqual(cloned[0], testObj1);
      });
    });

    describe('#extend', function() {
      it('should return the first object', function() {
        var testObj = {};
        assert.equal(keylime.util.extend(testObj), testObj);
      });

      it('should copy properties from the second object to the first', function() {
        var obj1 = { one: 1 };
        var obj2 = { two: 2 };
        keylime.util.extend(obj1, obj2);
        assert.equal(obj1.two, 2);
      });

      it('should not modify properties from the second object', function() {
        var obj1 = { one: 1 };
        var obj2 = { two: 2 };
        keylime.util.extend(obj1, obj2);
        assert.deepEqual({two: 2}, obj2);
      });

      it('should overwrite properties with the same name from right to left', function() {
        var obj1 = { one: 1 };
        var obj2 = { one: 2 };
        keylime.util.extend(obj1, obj2);
        assert.equal(obj1.one, 2);
      });

      it('should support n number of objects to extend from', function() {
        assert.deepEqual({
          name: 'Force Push',
          power: 100,
          available: true
        }, keylime.util.extend({name: 'force push', power: 50}, {power: 75}, {available: true, power: 100}, {name: 'Force Push'}));
      });
    });
  });

  describe('KeylimeConstructor prototype', function() {

    it('should have it\'s prototype set to Function.prototype', function() {
      assert.equal(keylime.core.KeylimeConstructor.prototype.__proto__, Function.prototype);
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
    });

  });

}());
