(function() {
  'use strict';

  var _ = require('lodash');

  /**
   * The Keylime function is the brains of this module.
   * It produces new constructor functions that have a
   * few special methods for defining how that constructor
   * should behave.
   */
  module.exports = keylime;

  // The following line is used by a build process
  // to build browser versions of keylime
  // !!!---

  /**
   * Shared object for tracking global plugins.
   * Use `registerGlobal` and `deregisterGlobal`
   * for registering shared plugins.
   */
  var globalPlugins = {};
  keylime.registerGlobal = registerGlobal;
  keylime.deregisterGlobal = deregisterGlobal;
  keylime.registeredGlobals = registeredGlobals;

  function keylime(name) {
    var constructor;

    /**
     * A name is required so that we can properly name
     * the constructor function we are going to return.
     */
    if (!_.isString(name)) {
      throw new Error('You must supply a \'name\' parameter to the Keylime function');
    }

    /**
     * I decided to use eval here, so that I could capture
     * the 'name' parameter and use it inside the function
     * to keep a reference of the constructor itself. If I
     * used `this`, it would be referencing the instance of
     * the constructor, not the function itself.
     */
    constructor = eval('function '+name+'(){var topArgs = arguments; var OriginalClass = '+name+'; var create'+name+' = function create'+name+'() { function '+name+'() { return OriginalClass.apply(this, topArgs); }; '+name+'.prototype = OriginalClass.prototype; return new '+name+'(); }; if (!(this instanceof '+name+')) { return create'+name+'(); }; if (!this._model) {Object.defineProperties(this, {_model: {value: '+name+'}});}Object.getPrototypeOf('+name+'.prototype).constructor.apply(this, arguments);};'+name);

    /**
     * The "parent" attribute can contain a reference to another
     * constructor. We initiall create it as an object so that
     * the object will be shared among all instances, even if parents
     * are added after the instance is created.
     */
    constructor._parent = { constructor: null };

    /**
     * This "blueprint" object describes what each instance
     * of the constructor should look like. It lives on the
     * function itself so that it can be shared by all instances.
     */
    constructor._blueprint = {};

    /**
     * This property will be updated each time a new attribute
     * is added to the blueprint. Helper methods that modify
     * attributes in the blueprint can use this property
     * to lookup the "last added" attribute to determine context.
     * This lets the constructor have nice chain-able methods.
     */
    constructor._lastAttr = null;

    /**
     * This internal array will hold any functions that need to
     * be executed when a new instances is created.
     */
    constructor._initHandlers = [];

    /**
     * Now we just bind all of the constructor helper methods
     * so that they can properly mutate the "blueprint".
     */
    constructor.attr = attr.bind(constructor);
    constructor.attrs = attrs.bind(constructor);
    constructor.inherits = constructor.inherit = inherits.bind(constructor);
    constructor.use = use.bind(constructor);
    constructor.method = method.bind(constructor);
    constructor.classMethod = classMethod.bind(constructor);
    constructor.attrHelper = attrHelper.bind(constructor);
    constructor.classHelper = classHelper.bind(constructor);
    constructor.init = init.bind(constructor);
    constructor.create = create.bind(constructor);

    /**
     * Call `use` for every globally registered plugin.
     */
    _.forIn(globalPlugins, function registerGlobalPlugin(plugin) {
      constructor.use(plugin);
    });

    /**
     * Set the new constructors prototype to the KeylimeModel.
     * This allows us to keep all shared methods on that same
     * model, as well as detect other Keylime-made constructors.
     */
    constructor.prototype.__proto__ = KeylimeModel.prototype;

    return constructor;
  }

  /**
   * The attr function is used to add attributes to constructors.
   * Each time an attribute is added, this function will also update
   * the "last attribute" property. That way chained methods can know
   * which attribute to modify.
   */
  function attr(name, value) {
    if (!_.isString(name)) {
      throw new Error('You must supply a \'name\' argument to create an attribute on '+ this.name +'.');
    }

    /**
     * If an object or array is passed in for the default value,
     * we immediatly make a clone of it. This way if the default
     * value is passed in by reference, changes to that object
     * won't change what the default value is.
     */
    if (_.isUndefined(value)) {
      value = null;
    } else if (_.isArray(value) || _.isPlainObject(value)) {
      value = _.cloneDeep(value);
    }

    /**
     * Add a new attribute to the blueprint. If no default
     * value argument is provided, it is auto set to null.
     */
    this._blueprint[name] = {
      value: value
    };

    /**
     * Update the "last attribute" property so that other
     * methods can access and modify it.
     */
    this._lastAttr = name;

    return this;
  }

  /**
   * The inherits method provides basic iheritance support for Keylime.
   * It takes in another Keylime constructor and sets it as the current
   * constructors prototype. This also setups up structure to inherit
   * the blueprint of the parent constructor.
   */
  function inherits(constructor) {
    if (!_.isFunction(constructor)) {
      throw new Error('You must supply a \'constructor\' function argument to add inheritance on '+ this.name +'.');
    }

    /**
     * The inherit method only supports inheritance of other Keylime constructors.
     * This requirement allows me to assume each parent constructor has the same
     * "blueprint" structure for assembling attributes.
     */
    if (!_isKeylimeConstructor(constructor)) {
      throw new Error('You must supply another Keylime constructor to add inheritance on '+ this.name +'.');
    }

    /**
     * Update the prototype with the new constructor
     */
    this.prototype.__proto__ = constructor.prototype;

    /**
     * Update the parent property with the constructor so that we can
     * invoke it later when creating new intances.
     */
    this._parent.constructor = constructor;

    return this;
  }

  /**
   * The KeylimeModel is the root constructor for all the other
   * constructors the Keylime function returns.
   */
  function KeylimeModel(values) {
    recursiveApplyBlueprint.call(this, this._model, values);
    recursiveCallHandlers.apply(this, _.flatten([this._model, arguments]));
  }

  function recursiveCallHandlers() {
    var constructor = _.first(arguments),
        args = _.rest(arguments, 1);

    /**
     * Call parent handlers first.
     */
    if (!_.isNull(constructor._parent.constructor)) {
      recursiveCallHandlers.apply(this, _.flatten([constructor._parent.constructor, args]));
    }

    /**
     * Call each handler with the instance as the argument.
     */
    _.each(constructor._initHandlers, function(handler) {
      handler.apply(this, args);
    }, this);
  }

  /**
   * This function will walk up the parent tree of a Keylime
   * constructor and apply the blueprint for each one.
   */
  function recursiveApplyBlueprint(constructor, values) {
    /**
     * Apply any attributes of the parent model first.
     */
    if (!_.isNull(constructor._parent.constructor)) {
      recursiveApplyBlueprint.call(this, constructor._parent.constructor, values);
    }

    /**
     * Go through this models blueprint property and apply the
     * attributes to the instance.
     */
    _.forIn(constructor._blueprint, function(value, key) {
      if (_.isArray(value.value) || _.isPlainObject(value.value)) {
        this[key] = _.cloneDeep(value.value);
      } else if (_.isFunction(value.value)) {
        this[key] = value.value();
      } else {
        this[key] = value.value;
      }
    }, this);

    /**
     * Go through the parameters and apply them to the instance.
     * Only valid attributes will actually get parsed.
     */
    _.forIn(_.pick(values, _.keys(constructor._blueprint)), function(value, key) {
      if (_.isArray(value) || _.isPlainObject(value)) {
        this[key] = _.cloneDeep(value);
      } else if (_.isFunction(value)) {
        this[key] = value();
      } else {
        this[key] = value;
      }
    }, this);
  }

  /**
   * The use function is enables middleware-style patterns for
   * constructors. Any function passed will be invoked with
   * with the constructor as an argument. The function can then
   * modify and extend the constructor in a pluggable way.
   */
  function use(func) {
    if (!_.isFunction(func)) {
      throw new Error('You must supply a function argument to call the \'use\' method on '+this.name+'.');
    }

    func(this);

    return this;
  }

  /**
   * The create method provides an alternative way to create
   * instances of class.
   */
  function create() {
    return this.apply(null, arguments);
  }

  /**
   * The 'method' function is purely syntax sugar for adding
   * functions to constructor prototypes.
   */
  function method(name, func) {
    if (!_.isString(name)) {
      throw new Error('You must supply a \'name\' argument to add a method on '+this.name+'.');
    }

    if (!_.isFunction(func)) {
      throw new Error('You must supply a function argument to add a method on '+this.name+'.');
    }

    this.prototype[name] = func;

    return this;
  }

  /**
   * The 'classMethod' function is syntax sugar for adding
   * "class-level" functions to constructors. Its the same
   * as doing Model.someFunc = function() { ... }, but in
   * a chain-able syntax.
   */
  function classMethod(name, func) {
    if (!_.isString(name)) {
      throw new Error('You must supply a \'name\' argument to add a class method on '+this.name+'.');
    }

    if (!_.isFunction(func)) {
      throw new Error('You must supply a function argument to add a class method on '+this.name+'.');
    }

    this[name] = func;

    return this;
  }

  /**
   * The attrHelper method is a convinience method for defining
   * an attribute modifier on a constructor.
   */
  function attrHelper(name, func) {
    if (!_.isString(name)) {
      throw new Error('You must supply a \'name\' argument to add an attribute helper on '+this.name+'.');
    }

    if (!_.isFunction(func)) {
      throw new Error('You must supply a function argument to add an attribute helper on '+this.name+'.');
    }

    /**
     * He we wrap the function argument passed in with a new function,
     * and apply it to the constructor.
     */
    this[name] = function attrHelperProduct() {
      var lastAttribute;

      if (_.isNull(this._lastAttr)) {
        throw new Error('You must add an attribute on '+this.name+' before you can use the '+name+' helper.');
      }

      lastAttribute = this._blueprint[this._lastAttr];

      /**
       * When the newly added helper method is called, pass the
       * last attribute along with the rest of the called arguments
       * along to the function that was passed in.
       */
      func.apply(this, _.flatten([lastAttribute, [].slice.call(arguments)]));

      return this;
    }.bind(this);

    return this;
  }

  /**
   * The classHelper method is a convinience method for defining
   * class-level modifiers. Its similar to calling `attr` helper,
   * but it receives the constructor as the first argument instead
   * of the last-added attribute.
   */
  function classHelper(name, func) {
    if (!_.isString(name)) {
      throw new Error('You must supply a \'name\' argument to add a class helper on '+this.name+'.');
    }

    if (!_.isFunction(func)) {
      throw new Error('You must supply a function argument to add a class helper on '+this.name+'.');
    }

    /**
     * He we wrap the function argument passed in with a new function,
     * and apply it to the constructor.
     */
    this[name] = function classHelperProduct() {
      /**
       * When the newly added helper method is called, pass
       * the arguments along to the function that was passed in.
       */
      func.apply(this, arguments);

      return this;
    }.bind(this);

    return this;
  }

  /**
   * The attrs helper can be fetches attributes from the constructor.
   */
  function attrs(name) {
    if (_.isString(name)) {
      return this._blueprint[name];
    }
    return this._blueprint;
  }

  /**
   * The init method accumulates functions in an handlers array.
   * These handlers will be invoked with when a new instance is created.
   */
  function init(handler) {
    if (!_.isFunction(handler)) {
      throw new Error('You must supply a function to add an initialization handler on '+this.name+'.');
    }

    this._initHandlers.push(handler);

    return this;
  }

  /**
   * Registers a plugin function globally. Any constructors created
   * _after_ registering the automatically be called through `use`
   * when the constructor is created.
   */
  function registerGlobal(name, plugin) {
    if (!_.isString(name)) {
      throw new Error('You must supply a \'name\' parameter to register a plugin globally on Keylime.');
    }

    if (!_.isFunction(plugin)) {
      throw new Error('You must supply a function to register a plugin globally on Keylime.');
    }
    globalPlugins[name] = plugin;
    return plugin;
  }

  /**
   * De-registers a plugin function globally. Does not affect constructors
   * created before the plugin was de-registered.
   */
  function deregisterGlobal(name) {
    var plugin;
    if (!_.isString(name)) {
      throw new Error('You must supply a name to de-register a plugin globally on Keylime.');
    }

    if (!_.isFunction(globalPlugins[name])) {
      return false;
    }

    plugin = globalPlugins[name];
    globalPlugins[name] = null;
    delete globalPlugins[name];
    return plugin;
  }

  /**
   * Returns the list of globally registered plugins.
   */
  function registeredGlobals(name) {
    var plugins = _.cloneDeep(globalPlugins);

    if (_.isString(name)) {
      return plugins[name];
    } else {
      return plugins;
    }
  }

  /**
   * Helper function for checking if a constructor
   * function is a Keylime constructor
   */
  function _isKeylimeConstructor(constructor) {
    if (!_.isFunction(constructor)) {
      return false;
    }

    if (!_.isPlainObject(constructor._blueprint)) {
      return false;
    }

    return true;
  }

  // !!!---
  // The above line is used by a build process
  // to build browser versions of Keylime
}());
