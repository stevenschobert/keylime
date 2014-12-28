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

    });

  });

}());
