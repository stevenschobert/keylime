(function() {
  'use strict';

  var keylime = require('../');
  var assert = require('assert');

  describe('helpers', function() {

    describe('#unregisterHelper', function() {
      it('should remove a property from the KeylimeConstructor.prototype object using the \'name\' parameter', function() {
        keylime.registerHelper('testHelper', function() {});
        keylime.unregisterHelper('testHelper');
        assert(keylime.prototypes.KeylimeConstructor.prototype.testHelper === undefined);
      });

      it('should return false if no plugin is registered', function() {
        assert.equal(keylime.unregisterHelper('testHelper'), false);
      });
    });

    describe('#registerHelper', function() {
      afterEach(function() {
        keylime.unregisterHelper('testHelper');
      });

      it('should not override existing properties on KeylimeConstructor.prototype', function() {
        assert.throws(function() {keylime.registerHelper('attr', function() {});}, /already/);
      });

      it('should add property to KeylimeConstructor.prototype using the \'name\' parameter', function() {
        keylime.registerHelper('testHelper', function() {});
        assert(keylime.prototypes.KeylimeConstructor.prototype.testHelper !== undefined);
      });

      it('should set the KeylimeConstructor.prototype property value to a function', function() {
        keylime.registerHelper('testHelper', function() {});
        assert.equal(typeof keylime.prototypes.KeylimeConstructor.prototype.testHelper, 'function');
      });

      it('should not invoke the function during registration', function() {
        var called = 0;
        var helper = function() {++called;};
        keylime.registerHelper('testHelper', helper);
        assert.equal(called, 0);
      });

      it('should invoke the function when the helper function is called on a constructor', function() {
        var called = 0;
        var helper = function() {++called;};
        keylime.registerHelper('testHelper', helper);
        keylime('Test').testHelper();
        assert.equal(called, 1);
      });

      it('should pass the current constructor to the helper function', function() {
        var capture = null;
        var helper = function(constructor) {capture = constructor;};
        var Test = keylime('Test');
        keylime.registerHelper('testHelper', helper);
        Test.testHelper();
        assert.equal(capture, Test);
      });

      it('should pass remaining arguments to the helper function', function() {
        var capture = null;
        var helper = function(c, other) {capture = other;};
        var Test = keylime('Test');
        keylime.registerHelper('testHelper', helper);
        Test.testHelper(1);
        assert.equal(capture, 1);
      });

      it('should always return the same constructor when calling the', function() {
        var helper = function() {};
        var Test = keylime('Test');
        keylime.registerHelper('testHelper', helper);
        assert.equal(Test, Test.testHelper());
      });
    });
  });
}());
