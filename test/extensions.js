(function() {
  'use strict';

  var keylime = require('../');
  var assert = require('assert');

  describe('extensions', function() {

    describe('#unregisterExtension', function() {
      it('should remove a property from the KeylimeConstructor.prototype object using the \'name\' parameter', function() {
        keylime.registerExtension('testExtension', function() {});
        keylime.unregisterExtension('testExtension');
        assert(keylime.prototypes.KeylimeConstructor.prototype.testExtension === undefined);
      });

      it('should return false if no plugin is registered', function() {
        assert.equal(keylime.unregisterExtension('testExtension'), false);
      });
    });

    describe('#registerExtension', function() {
      afterEach(function() {
        keylime.unregisterExtension('testExtension');
      });

      it('should not override existing properties on KeylimeConstructor.prototype', function() {
        assert.throws(function() {keylime.registerExtension('attr', function() {});}, /already/);
      });

      it('should add property to KeylimeConstructor.prototype using the \'name\' parameter', function() {
        keylime.registerExtension('testExtension', function() {});
        assert(keylime.prototypes.KeylimeConstructor.prototype.testExtension !== undefined);
      });

      it('should set the KeylimeConstructor.prototype property value to a function', function() {
        keylime.registerExtension('testExtension', function() {});
        assert.equal(typeof keylime.prototypes.KeylimeConstructor.prototype.testExtension, 'function');
      });

      it('should not invoke the function during registration', function() {
        var called = 0;
        var extension = function() {++called;};
        keylime.registerExtension('testExtension', extension);
        assert.equal(called, 0);
      });

      it('should invoke the function when the extension function is called on a constructor', function() {
        var called = 0;
        var extension = function() {++called;};
        keylime.registerExtension('testExtension', extension);
        keylime('Test').testExtension();
        assert.equal(called, 1);
      });

      it('should pass the current constructor to the extension function', function() {
        var capture = null;
        var extension = function(constructor) {capture = constructor;};
        var Test = keylime('Test');
        keylime.registerExtension('testExtension', extension);
        Test.testExtension();
        assert.equal(capture, Test);
      });

      it('should pass remaining arguments to the extension function', function() {
        var capture = null;
        var extension = function(c, other) {capture = other;};
        var Test = keylime('Test');
        keylime.registerExtension('testExtension', extension);
        Test.testExtension(1);
        assert.equal(capture, 1);
      });

      it('should always return the same constructor when calling the', function() {
        var extension = function() {};
        var Test = keylime('Test');
        keylime.registerExtension('testExtension', extension);
        assert.equal(Test, Test.testExtension());
      });
    });
  });
}());
