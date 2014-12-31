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
    });
  });

}());
