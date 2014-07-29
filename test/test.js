(function() {
  'use strict';

  var keylime = require('../'),
      assert = require('assert'),
      _ = require('lodash');

  describe('Keylime function', function() {
    it('should require a name parameter', function() {
      assert.throws(keylime);
    });

    it('should return a function', function() {
      assert(_.isFunction(keylime('User')));
    });

    describe('returned constructor', function() {
      it('should be named according to the name parameter', function() {
        assert.equal(keylime('TestFunc').name, 'TestFunc');
      });

      describe('blueprint property', function() {
        it('should be an object', function() {
          assert(_.isPlainObject(keylime('Test')._blueprint));
        });

        it('should not be shared with other constructors', function() {
          var blueprint = keylime('Test')._blueprint;
          blueprint.key = 'value';
          assert(!_.has(keylime('New')._blueprint), 'key');
        });
      });

      describe('when invoked', function() {
        it('should apply attributes of the parents', function() {
          var User = keylime('User').attr('name'),
              Admin = keylime('Admin').inherits(User).attr('security'),
              SuperAdmin = keylime('SuperAdmin').inherits(Admin).attr('master_key'),
              larry = new Admin(),
              curly = new SuperAdmin();
          assert(_.has(larry, 'name'));
          assert(_.has(larry, 'security'));
          assert(_.has(curly, 'name'));
          assert(_.has(curly, 'security'));
          assert(_.has(curly, 'master_key'));
        });

        it('should execute any functions in the blueprint', function() {
          var ran = 0,
              Test = keylime('Test').attr('custom', function() { ++ran; return true; }),
              instance = new Test();
          assert.equal(instance.custom, true);
          assert.equal(ran, 1);
        });

        it('should execute any functions in the values parameter for attribute values', function() {
          var ran = 0,
              Test = keylime('Test').attr('custom'),
              instance = new Test({ custom: function() { ++ran; return true; }});
          assert.equal(instance.custom, true);
          assert.equal(ran, 1);
        });

        it('should not execute any functions in the values parameters for invalid attributes', function() {
          var ran = 0,
              Test = keylime('Test'),
              instance = new Test({ custom: function() { ++ran; return true; }});
          assert(!_.has(instance, 'custom'));
          assert.equal(ran, 0);
        });

        describe('without the new keyword', function() {
          it('should throw an error', function() {
            var model = keylime('Test');
            assert.throws(model, /new/i);
          });
        });

        describe('without any arguments', function() {
          it('should return an instance of the constructor', function() {
            var User = keylime('User'),
                joe = new User();
            assert(joe instanceof User);
          });

          it('should create attributes on the instance using default values', function() {
            var User = keylime('User').attr('test', 2),
                model = new User();
            assert.equal((new User()).test, 2);
          });
        });

        describe('with an object parameter', function() {
          it('should apply the matching attribute values to the instance', function() {
            var User = keylime('User').attr('name', 'none'),
                model = new User({name: 'test'});
            assert.equal(model.name, 'test');
          });

          it('should not set values that aren\'t attributes', function() {
            var User = keylime('User'),
                model = new User({misc: 'test'});
            assert(!_.has(model, 'misc'));
          });
        });
      });

      describe('attr method', function() {
        it('should add a key to the blueprint property', function() {
          var model = keylime('Test').attr('name');
          assert(_.has(model._blueprint, 'name'));
        });

        it('should add an object to the blueprint property', function() {
          var model = keylime('Test').attr('name');
          assert(_.isPlainObject(model._blueprint.name));
        });

        it('should update the last attribute property', function() {
          var model = keylime('Test').attr('name');
          assert.equal(model._lastAttr, 'name');
        });

        it('should return the constructor function for chaining', function() {
          var model = keylime('Test');
          assert.equal(model, model.attr('name'));
        });

        describe('when invoked', function() {
          describe('without a name argument', function() {
            it('should throw an error', function() {
              assert.throws(keylime('Test').attr, /test/i);
            });
          });

          describe('without a value argument', function() {
            it('should set the value to null', function() {
              var model = keylime('Test').attr('name');
              assert(_.isNull(model._blueprint.name.value));
            });
          });

          describe('with a value argument', function() {
            it('should set the value to the argument', function() {
              var model = keylime('Test').attr('name', 6);
              assert.equal(model._blueprint.name.value, 6);
            });
          });
        });
      });

      describe('inherits method', function() {
        it('should have an alias \'inherit\'', function() {
          var model = keylime('Test');
          assert.equal(model.inherit, model.inherits);
        });

        it('should return the same constructor for chaining', function() {
          var model = keylime('Test'),
              model2 = keylime('Test2');
          assert.equal(model, model.inherits(model2));
        });

        describe('when invoked', function() {
          describe('with a non-function argument', function() {
            it('should throw an error', function() {
              assert.throws(function() { keylime('Test').inherits({}); }, /function/i);
            });
          });

          describe('with a non-keylime constructor', function() {
            it('should thow an error', function() {
              var MyCustom = function() {};
              assert.throws(function() { keylime('Test').inherits(MyCustom); }, /keylime/i);
            });
          });

          describe('with another keylime constructor argument', function() {
            it('should inherit prototype methods', function() {
              var User = keylime('User'),
                  Admin = keylime('Admin').inherits(User),
                  model1 = new User(),
                  model2 = new Admin();

              User.prototype.sayHello = function() {
                return 'hello';
              };

              assert.equal(model1.sayHello, model2.sayHello);
            });
          });
        });
      });

    });
  });
}());
