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
    constructor = eval('function '+name+'(){assert(this instanceof '+name+', "You must supply the \'new\' keyword to create a new '+name+'."); if (!this._model) {Object.defineProperties(this, {_model: {value: '+name+'}});}Object.getPrototypeOf('+name+'.prototype).constructor.apply(this, arguments);};'+name);

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
     * Now we just bind all of the constructor helper methods
     * so that they can properly mutate the "blueprint".
     */
    constructor.attr = attr.bind(constructor);
    constructor.inherits = constructor.inherit = inherits.bind(constructor);

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
     * Add a new attribute to the blueprint. If no default
     * value argument is provided, it is auto set to null.
     */
    this._blueprint[name] = {
      value: _.isUndefined(value) ? null : value
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
      constructor.prototype instanceof KeylimeModel,
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
}());
