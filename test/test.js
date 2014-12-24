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
  });
}());
