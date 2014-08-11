(function() {
  'use strict';

  var _ = require('lodash'),
      assert = require('assert');

  /**
   * The Keylime function is the brains of this module.
   * It produces new constructor functions that have a
   * few special methods for defining how that constructor
   * should behave.
   */
  module.exports = Keylime;
  function Keylime(name) {
    var constructor;

    /**
     * A name is required so that we can properly name
     * the constructor function we are going to return.
     */
    assert(name, 'You must supply a \'name\' parameter to the Keylime function');

    /**
     * I decided to use eval here, so that I could capture
     * the 'name' parameter and use it inside the function
     * to keep a reference of the constructor itself. If I
     * used `this`, it would be referencing the instance of
     * the constructor, not the function itself.
     */
    constructor = eval('function '+name+'(){var topArgs = arguments; var '+name+'Wrap = function '+name+'Wrap() {return '+name+'.apply(this, topArgs)};'+name+'Wrap.prototype = '+name+'.prototype; if (!(this instanceof '+name+')) {return new '+name+'Wrap();}; if (!this._model) {Object.defineProperties(this, {_model: {value: '+name+'}});}Object.getPrototypeOf('+name+'.prototype).constructor.apply(this, arguments);};'+name);

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
     * be executed when a new instances is craeted.
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
    constructor.attrHelper = attrHelper.bind(constructor);
    constructor.init = init.bind(constructor);

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
    assert(name, 'You must supply a \'name\' argument to create an attribute on '+ this.name +'.');

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
    assert(
      _.isFunction(constructor),
      'You must supply a \'constructor\' function argument to add inheritance on '+ this.name +'.'
    );

    /**
     * The inherit method only supports inheritance of other Keylime constructors.
     * This requirement allows me to assume each parent constructor has the same
     * "blueprint" structure for assembling attributes.
     */
    assert(
      _isKeylimeConstructor(constructor),
      'You must supply another Keylime constructor to add inheritance on '+ this.name +'.'
    );

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
    recursiveCallHandlers.call(this, this._model);
  }

  function recursiveCallHandlers(constructor) {
    /**
     * Call parent handlers first.
     */
    if (!_.isNull(constructor._parent.constructor)) {
      recursiveCallHandlers.call(this, constructor._parent.constructor);
    }

    /**
     * Call each handler with the instance as the argument.
     */
    _.each(constructor._initHandlers, function(handler) {
      handler(this);
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
    assert(
      _.isFunction(func),
      'You must supply a function argument to call the \'use\' method on '+this.name+'.'
    );

    func(this);

    return this;
  }

  /**
   * The 'method' function is purely syntax sugar for adding
   * functions to constructor prototypes.
   */
  function method(name, func) {
    assert(
      _.isString(name),
      'You must supply a \'name\' argument to add a method on '+this.name+'.'
    );

    assert(
      _.isFunction(func),
      'You must supply a function argument to add a method on '+this.name+'.'
    );

    this.prototype[name] = func;

    return this;
  }

  /**
   * The attrHelper method is a convinience method for defining
   * an attribute modifier on a constructor.
   */
  function attrHelper(name, func) {
    assert(
      _.isString(name),
      'You must supply a \'name\' argument to add an attribute helper on '+this.name+'.'
    );

    assert(
      _.isFunction(func),
      'You must supply a function argument to add an attribute helper on '+this.name+'.'
    );

    /**
     * He we wrap the function argument passed in with a new function,
     * and apply it to the constructor.
     */
    this[name] = function attrHelperProduct() {
      var lastAttribute;

      assert(
        !_.isNull(this._lastAttr),
        'You must add an attribute on '+this.name+' before you can use the '+name+' helper.'
      );

      lastAttribute = this._blueprint[this._lastAttr];

      /**
       * When the newly added helper method is called, pass the
       * last attribute along with the rest of the called arguments
       * along to the function that was passed in.
       */
      func.apply(func, _.flatten([lastAttribute, [].slice.call(arguments)]));

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
    assert(
      _.isFunction(handler),
      'You must supply a function to add an initialization handler on '+this.name+'.'
    );

    this._initHandlers.push(handler);

    return this;
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
}());
