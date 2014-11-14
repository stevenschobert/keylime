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

    describe('plugins', function() {
      var plugin = function() {};

      before(function() {
        keylime.registerPlugin('myplugin', plugin);
      });

      after(function() {
        keylime.unregisterPlugin('myplugin');
      });

      it('should return a list of global plugins', function() {
        assert.equal(keylime.plugins('myplugin'), plugin);
      });
    });

    describe('unregisterPlugin', function() {
      var count;
      var plugin = function() {++count;};

      describe('with a valid name', function() {
        beforeEach(function() {
          count = 0;
        });

        it('should return the function', function() {
          keylime.registerPlugin('myplugin', plugin);
          assert.equal(plugin, keylime.unregisterPlugin('myplugin'));
        });

        it('should remove that plugin from available plugins when calling `use`', function() {
          keylime.registerPlugin('myplugin', plugin);
          keylime.unregisterPlugin('myplugin');
          assert.throws(function() { keylime('Post').use('myplugin'); });
        });
      });

      describe('with an in-valid name', function() {
        it('should return false', function() {
          assert(!keylime.unregisterPlugin('nothing'));
        });
      });
    });

    describe('registerPlugin', function() {
      var count;
      var customPlugin = function(Model) { Model.custom = function() {}; ++count; };
      var pluginName = 'myplugin';

      beforeEach(function() {
        count = 0;
      });

      afterEach(function() {
        keylime.unregisterPlugin(pluginName);
      });

      describe('without a name', function() {
        it('should throw an error', function() {
          assert.throws(function() { keylime.registerPlugin(true); }, /name.*register/i);
        });
      });

      describe('without a non-function value', function() {
        it('should throw an error', function() {
          assert.throws(function() { keylime.registerPlugin(pluginName, true); }, /function.*register/i);
        });
      });

      describe('with the same name', function() {
        it('should replace the plugin', function() {
          var newplugin = function() {};
          keylime.registerPlugin(pluginName, customPlugin);
          keylime.registerPlugin(pluginName, newplugin);
          assert.equal(keylime.plugins(pluginName), newplugin);
        });
      });

      it('should not invoke the plugin right away', function() {
        keylime.registerPlugin(pluginName, customPlugin);
        assert.equal(count, 0);
        keylime.unregisterPlugin(pluginName, customPlugin);
      });

      it('should not invoke the plugin if it is not `used`', function() {
        keylime.registerPlugin(pluginName, customPlugin);
        keylime('Post').attr('name');
        assert.equal(count, 0);
        keylime.unregisterPlugin(pluginName, customPlugin);
      });

      it('should make the plugin available for `use` with a string', function() {
        keylime('Model');
        keylime.registerPlugin(pluginName, customPlugin);
        keylime('Post').use(pluginName);
        assert.equal(count, 1);
      });

      it('should be able to extend every new class created', function() {
        assert(_.isUndefined(keylime('Model').custom));
        keylime.registerPlugin(pluginName, customPlugin);
        assert(_.isFunction(keylime('Post').use(pluginName).custom));
      });
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

        it('should copy any arrays in values parameter', function() {
          var Test = keylime('Test').attr('arr'),
              testArr = [],
              instance1 = new Test({arr: testArr}),
              instance2 = new Test({arr: testArr});
          assert.deepEqual(instance1.arr, instance2.arr);
          instance1.arr.push('test');
          assert(!_.contains(instance2.arr, 'test'));
        });

        it('should copy any arrays in default values', function() {
          var Test = keylime('Test').attr('arr', ['test']),
              instance1 = new Test(),
              instance2 = new Test();
          assert.deepEqual(instance1.arr, ['test']);
          assert.deepEqual(instance2.arr, ['test']);
          instance1.arr.push('newtest');
          assert(!_.contains(instance2.arr, 'newtest'));
        });

        it('should copy any objects in values parameter', function() {
          var Test = keylime('Test').attr('obj'),
              testObj = {},
              instance1 = new Test({obj: testObj}),
              instance2 = new Test({obj: testObj});
          assert.deepEqual(instance1.obj, instance2.obj);
          instance1.obj.test = 'test';
          assert(!_.has(instance2.obj, 'test'));
        });

        it('should copy any objects in default values', function() {
          var Test = keylime('Test').attr('obj', {test: 'value'}),
              instance1 = new Test(),
              instance2 = new Test();
          assert.deepEqual(instance1.obj, {test: 'value'});
          assert.deepEqual(instance2.obj, {test: 'value'});
          instance1.obj.newtest = 'value';
          assert(!_.has(instance2.obj, 'newtest'));
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
          it('should still return an instance', function() {
            var model = keylime('Test').attr('name', 'test'),
                instance = model({name: 'true2'});
            assert(instance instanceof model);
            assert.equal(instance.name, 'true2');
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

      describe('create method', function() {
        it('should return a new instance', function() {
          var User = keylime('User'),
              model = User.create();
          assert(model instanceof User);
        });

        it('should apply all the same arguments as calling \'new\'', function() {
          var User = keylime('User').attr('name'),
              model1 = User.create({name: 'test'}),
              model2 = new User({name: 'test'});
          assert.deepEqual(model1, model2);
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

          describe('with an array value argument', function() {
            it('should create a copy of the array', function() {
              var testArr = ['test'],
                  Test = keylime('Test').attr('arr', testArr);
              testArr.push('newtest');
              assert(!_.contains(Test._blueprint.arr.value, 'newtest'));
            });
          });

          describe('with a object value argument', function() {
            it('should create a copy of the array', function() {
              var testObj = {test: 'value'},
                  Test = keylime('Test').attr('obj', testObj);
              testObj.newtest = 'value';
              assert(!_.has(Test._blueprint.obj.value, 'newtest'));
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

      describe('use method', function() {
        describe('when invoked with a non-function or string', function() {
          it('should throw an error', function() {
            var test = keylime('Test');
            assert.throws(test.use, /function.*use/i);
          });
        });

        it('should return the same constructor', function() {
          var Test = keylime('Test');
          assert.equal(Test, Test.use(function() {}));
        });

        describe('with a function argument', function() {
          it('should be invoked immediately', function() {
            var ran = 0,
                Test = keylime('Test').use(function() { ++ran; });
            assert.equal(ran, 1);
          });

          it('should receive the constructor as an argument', function() {
            var Test = keylime('Test'),
                ref;
            Test.use(function(con) { ref = con; });
            assert.equal(ref, Test);
          });

          it('should receive additional arguments', function() {
            var Test = keylime('Test'),
                ref;
            Test.use(function(con, two) { ref = two; }, 2);
            assert.equal(ref, 2);
          });
        });

        describe('with a string argument', function() {
          describe('with a valid plugin name', function() {
            var count;
            var plugin = function() { ++count; };

            beforeEach(function() {
              count = 0;
            });

            it('should invoke the global plugin', function() {
              keylime.registerPlugin('testplugin', plugin);
              var Test = keylime('Test').use('testplugin');
              assert.equal(count, 1);
              keylime.unregisterPlugin('testplugin');
            });

            it('should receive additional arguments', function() {
              var Test = keylime('Test'),
                  ref;
              keylime.registerPlugin('testplugin', function(model, two) { ref = two; });
              Test.use('testplugin', 2);
              assert.equal(ref, 2);
              keylime.unregisterPlugin('testplugin');
            });
          });

          describe('with an in-valid plugin name', function() {
            it('should throw an error', function() {
              assert.throws(function() { keylime('Post').use('blah'); }, /valid.*plugin/i);
            });
          });
        });
      });

      describe('method function', function() {
        describe('when invoked without any arguments', function() {
          it('should throw an error', function() {
            var test = keylime('Test');
            assert.throws(test.method, /supply.*method/i);
          });
        });

        it('should return the same constructor', function() {
          var test = keylime('Test');
          assert.equal(test, test.method('hello', function() {}));
        });

        it('should use the name argument to extend the prototype', function() {
          var Test = keylime('Test');
          Test.method('sayHello', function() {});
          assert(_.has(Test.prototype, 'sayHello'));
        });

        it('should add the function argument to the prototype', function() {
          var Test = keylime('Test'),
              sayHello = function() {};
          Test.method('sayHello', sayHello);
          assert.equal(Test.prototype.sayHello, sayHello);
        });
      });

      describe('classMethod method', function() {
        describe('when invoked without any arguments', function() {
          it('should throw an error', function() {
            var test = keylime('Test');
            assert.throws(test.classMethod, /supply.*class.*method/i);
          });
        });

        it('should return the same constructor', function() {
          var test = keylime('Test');
          assert.equal(test, test.classMethod('hello', function() {}));
        });

        it('should use the name argument to extend the constructor', function() {
          var Test = keylime('Test');
          Test.classMethod('sayHello', function() {});
          assert(_.has(Test, 'sayHello'));
        });

        it('should add the function argument to the constructor', function() {
          var Test = keylime('Test'),
              sayHello = function() {};
          Test.classMethod('sayHello', sayHello);
          assert.equal(Test.sayHello, sayHello);
        });
      });

      describe('attrs method', function() {
        describe('when invoked without any arguments', function() {
          it('should return the entire blueprint', function() {
            var Test = keylime('Test').attr('name');
            assert.equal(Test.attrs(), Test._blueprint);
          });
        });

        describe('when invoked with a name argument', function() {
          it('should return just the single attribute', function() {
            var Test = keylime('Test').attr('name');
            assert.equal(Test.attrs('name'), Test._blueprint.name);
          });
        });
      });

      describe('init method', function() {
        describe('when invoked without any arguments', function() {
          it('should throw an error', function() {
            var Test = keylime('Test');
            assert.throws(Test.init, /supply.*init/);
          });
        });

        it('should return the same constructor', function() {
          var Test = keylime('Test');
          assert.equal(Test, Test.init(function() {}));
        });

        it('should not run the function right away', function() {
          var Test = keylime('Test'),
              ran = 0;
          Test.init(function() { ++ran; });
          assert.equal(ran, 0);
        });

        it('should run the function when creating instances', function() {
          var Test = keylime('Test'),
              ran = 0;
          Test.init(function() { ++ran; });
          new Test();
          assert.equal(ran, 1);
        });

        it('should stack up multiple init handlers', function() {
          var Test = keylime('Test'),
              ran = 0,
              handler1 = function() { ++ran; },
              handler2 = function() { ++ran; };
          Test.init(handler1).init(handler2);
          new Test();
          assert.equal(ran, 2);
        });

        it('should recieve the arguments passed to the constructor', function() {
          var Test = keylime('Test'),
              arg;
          Test.init(function(one) { arg = one; });
          new Test('test');
          assert.equal(arg, 'test');
        });

        it('should use the instance as context', function() {
          var Test = keylime('Test'),
              context,
              instance;
          Test.init(function() { context = this; });
          instance = new Test();
          assert.equal(context, instance);
        });
      });

      describe('attrInit method', function() {
        describe('when invoked without any arguments', function() {
          it('should throw an error', function() {
            var Test = keylime('Test');
            assert.throws(Test.attrInit, /supply.*attribute.*init/);
          });
        });

        it('should return the same constructor', function() {
          var Test = keylime('Test');
          assert.equal(Test, Test.attrInit(function() {}));
        });

        it('should not run the function right away', function() {
          var Test = keylime('Test'),
              ran = 0;
          Test.attrInit(function() { ++ran; });
          assert.equal(ran, 0);
        });

        it('should run for every attribute when the instance is created', function() {
          var Test = keylime('Test').attr('name').attr('other'),
              ran = 0;
          Test.attrInit(function() { ++ran; });
          new Test();
          assert.equal(ran, 2);
        });

        it('should stack up multiple init handlers', function() {
          var Test = keylime('Test').attr('test'),
              ran = 0,
              handler1 = function() { ++ran; },
              handler2 = function() { ++ran; };
          Test.attrInit(handler1).attrInit(handler2);
          new Test();
          assert.equal(ran, 2);
        });

        it('should recieve the attribute name as the first argument', function() {
          var Test = keylime('Test').attr('name'),
              arg;
          Test.attrInit(function(one) { arg = one; });
          new Test();
          assert.equal(arg, 'name');
        });

        it('should recieve the attribute value as the second argument', function() {
          var Test = keylime('Test').attr('name'),
              arg;
          Test.attrInit(function(one, two) { arg = two; });
          new Test({name: 'luke'});
          assert.equal(arg, 'luke');
        });

        it('should recieve the attribute blueprint as the third argument', function() {
          var Test = keylime('Test').attr('name'),
              prop = Test._blueprint.name,
              arg;
          Test.attrInit(function(one, two, three) { arg = three; });
          new Test();
          assert.equal(arg, prop);
        });

        it('should use the instance as context', function() {
          var Test = keylime('Test').attr('name'),
              context,
              instance;
          Test.attrInit(function() { context = this; });
          instance = new Test();
          assert.equal(context, instance);
        });
      });

      describe('attrHelper method', function() {
        describe('when invoked without any arguments', function() {
          it('should throw an error', function() {
            var Test = keylime('Test');
            assert.throws(Test.attrHelper, /supply.*helper/i);
          });
        });

        it('should return the same constructor', function() {
          var Test = keylime('Test');
          assert.equal(Test, Test.attrHelper('helper', function() {}));
        });

        it('should register a method on the constructor using the name parameter', function() {
          var Test = keylime('Test').attrHelper('helper', function() {});
          assert(_.has(Test, 'helper'));
          assert(_.isFunction(Test.helper));
        });

        it('should not invoke the function immediately', function() {
          var Test = keylime('Test'),
              ran = 0;
          Test.attrHelper('helper', function() { ++ran; });
          assert.equal(ran, 0);
        });

        describe('the added function', function() {
          it('should return the same constructor', function() {
            var Test = keylime('Test').attrHelper('helper', function() {});
            assert.equal(Test, Test.attr('name').helper());
          });

          it('should throw an error if no attributes have been added', function() {
            var Test = keylime('Test').attrHelper('helper', function() {});
            assert.throws(Test.helper, /attribute.*helper/i);
          });

          it('should run the function argument', function() {
            var ran = 0,
                Test = keylime('Test').attrHelper('helper', function() { ++ran; });
            Test.attr('name').helper();
            assert.equal(ran, 1);
          });

          it('should have it\'s context set to the constructor', function() {
            var context,
                Test = keylime('Test').attrHelper('helper', function() { context = this; });
            Test.attr('name').helper();
            assert.equal(context, Test);
          });

          it('should pass the last attribute as the first argument', function() {
            var Test = keylime('Test').attr('name'),
                attr = Test._blueprint.name,
                capture;
            Test.attrHelper('helper', function(attr) { capture = attr; }).helper();
            assert.equal(attr, capture);
          });

          it('should pass the remaining arguments after the attribute', function() {
            var params,
                Test = keylime('Test').attrHelper('helper', function(attr, value) { params = value; });
            Test.attr('name').helper('woot');
            assert.equal(params, 'woot');
          });
        });
      });

      describe('classHelper function', function() {
        describe('when invoked without any arguments', function() {
          it('should throw an error', function() {
            var Test = keylime('Test');
            assert.throws(Test.classHelper, /supply.*helper/i);
          });
        });

        it('should return the same constructor', function() {
          var Test = keylime('Test');
          assert.equal(Test, Test.classHelper('helper', function() {}));
        });

        it('should register a method on the constructor using the name parameter', function() {
          var Test = keylime('Test').classHelper('helper', function() {});
          assert(_.has(Test, 'helper'));
          assert(_.isFunction(Test.helper));
        });

        it('should not invoke the function immediately', function() {
          var Test = keylime('Test'),
              ran = 0;
          Test.classHelper('helper', function() { ++ran; });
          assert.equal(ran, 0);
        });

        describe('the added function', function() {
          it('should return the same constructor', function() {
            var Test = keylime('Test').classHelper('helper', function() {});
            assert.equal(Test, Test.attr('name').helper());
          });

          it('should have it\'s context set to the constructor', function() {
            var context,
                Test = keylime('Test').classHelper('helper', function() { context = this; });
            Test.attr('name').helper('woot');
            assert.equal(context, Test);
          });

          it('should run the function argument', function() {
            var ran = 0,
                Test = keylime('Test').classHelper('helper', function() { ++ran; });
            Test.attr('name').helper();
            assert.equal(ran, 1);
          });

          it('should pass arguments to the original function', function() {
            var params,
                Test = keylime('Test').classHelper('helper', function(value) { params = value; });
            Test.attr('name').helper('woot');
            assert.equal(params, 'woot');
          });
        });
      });
    });
  });
}());
