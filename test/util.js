(function() {
  'use strict';

  var keylime = require('../');
  var assert = require('assert');

  describe('utilities', function() {
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
}());
