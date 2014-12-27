(function() {
  'use strict';

  var keylime = require('../');
  var assert = require('assert');
  var _ = require('lodash');

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
    });

  });

  describe('KeylimeConstructor prototype', function() {
    it('should have it\'s prototype set to Function.prototype', function() {
      assert.equal(keylime.core.KeylimeConstructor.prototype.__proto__, Function.prototype);
    });
  });

}());
