/**
 * Keylime.js
 *
 * @author     Steven Schobert <steven.schobert@ovenbits.com>
 * @version    1.0.0
 * @link       http://github.com/ovenbits/keylime
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.keylime = factory();
  }
}(this, function () {
  'use strict';

  // MARK -------------------------- keylime function --------------------------

  /**
   * Creates a new KeylimeConstructor function, or wraps an existing one. Also
   * doubles as the "module namespace", since it is the top level export
   *
   * @param  {string|function}      nameOrFunc  - name of function to create, or function to wrap
   * @return {KeylimeConstructor}               - a KeylimeConstructor function
   */
  function keylime(nameOrFunc) {
    if (typeof nameOrFunc === 'string') {
      nameOrFunc = createNamedConstructor(nameOrFunc);
    }
    return convertConstructorToKeylime(nameOrFunc);
  }


  // MARK ---------------------- KeylimeConstructor --------------------------

  /**
   * KeylimeConsturctor contains all the APIs for building prototypes. This is where the chain-able
   * syntax comes from.
   *
   * Orignally, I added those APIs by .bind()'ing them to functions. Instead, I created
   * KeylimeConstructor so that it can be used as the prototype for any function, and have access to
   * the APIs through the prototype chain.
   *
   * @param {object} [attrs] - attributes map to use for creating the descriptor
   */
  function KeylimeConstructor(attrs) {
    this.descriptor = new KeylimeDescriptor(attrs);
    this.prototype = this.prototype || {};
    Object.defineProperty(this.prototype, 'keylime', {
      value: this.descriptor
    });
  }
  KeylimeConstructor.prototype.__proto__ = Function.prototype;

  /**
   * Adds an "attribute" to the prototype map. Attributes are regarded as "instance properties", and
   * will be added to each new object the constructor creates.
   *
   * @param  {string}               name            - name of attribute to create
   * @param  {*}                    [defaultValue]  - default value to use for attribute
   * @param  {object}               [options]       - any arbitrary options to set the
   * @return {KeylimeConstructor}                   - the current function (for chaining)
   */
  KeylimeConstructor.prototype.attr = function attr(name, defaultValue, options) {
    this.descriptor.setAttr(name, defaultValue, extend({copyMode: 'deep', handlers: null}, options));
    return this;
  };

  /**
   * Returns the "attributes" map of the constructor. Though you can technically access the
   * attributes by simply using KeylimeConstructor.descriptor.attributes, I prefer to expose methods
   * so that I have a place to add additional logic down the road if I need to.
   *
   * @return {object} - the map of attributes on the keylime descriptor
   */
  KeylimeConstructor.prototype.getAttrs = function getAttrs() {
    return this.descriptor.attributes;
  };

  /**
   * Adds a function to the constructor's prototype object. This is just syntax sugar for doing
   * Func.prototype.hello = function hello() { ... }
   *
   * @param  {string}              name    - name of function to add
   * @param  {function}            func    - function to add
   * @return {KeylimeConstructor}          - same constructor for chaining
   */
  KeylimeConstructor.prototype.method = function method(name, func) {
    assert(typeof name === 'string', 'You must supply a \'name\' to add a method to a constructor.');
    assert(typeof func === 'function', 'You must supply a \'function\' to add a method to a constructor.');
    this.prototype[name] = func;
    return this;
  };

  /**
   * "Includes" provide mixin ability to KeylimeConstructors. This works very similarly to
   * extensions, except that it does not permantly extend KeylimeConstructor.prototype.
   *
   * The passed in function will receive the current constructor as the first argument.
   *
   * @param   {function}            func      - the include function to invoke
   * @return  {KeylimeConstructor}            - the same constructor for chaining
   */
  KeylimeConstructor.prototype.include = function include(func) {
    var args = [].slice.call(arguments);

    assert(typeof func === 'function', 'You must supply a \'function\' to add include a mixin on a constructor.');

    // replace the 'func' param in arguments list with the current constructor
    args[0] = this;
    func.apply(func, args);

    return this;
  };

  /**
   * Creates a new "instance" using the constructors prototoype and the KeylimeDescritor.
   * This more closely follows the "factory" pattern, if consumers want to avoid using new.
   *
   * @param     {object}      attrs       - override attributes
   * @return    {object}                  - new instance
   */
  KeylimeConstructor.prototype.create = function create() {
    var instance = {};
    instance.__proto__ = this.prototype;
    this.apply(instance, arguments);
    return instance;
  };

  /**
   * Hook arbitrary functions into the initialization cycle. This can allow functions to modify
   * attributes and instances at the time they are created.
   *
   * There is obviously performance implications with doing so (the functions are *blocking*),
   * but certain events (like 'attr'), have been optimized so they are as fast as possible.
   *
   * @param    {string}               event     - the event name to subscribe to
   * @param    {function}             handler   - the handler function to execute
   * @return   {KeylimeConstructor}             - the same constructor for chaining
   */
  KeylimeConstructor.prototype.on = function on(event, handler) {
    var eventName;

    if (arguments.length === 3) {
      eventName = arguments[1];
      handler = arguments[2];
    }

    assert(typeof event === 'string', 'A \'name\' is required to add an event handler.');
    assert(typeof handler === 'function', 'A function is required to add an event handler.');

    switch (event.toLowerCase()) {
      case 'init':
        this.descriptor.addInitHandler(handler);
        break;
      case 'attr':
        this.descriptor.addAttrHandler(eventName, handler);
        break;
    }

    return this;
  };

  /**
   * Removes event handlers from the KeylimeConstructor.
   * (non-chainable method)
   *
   * @param    {string}               event     - the event name to remove from
   * @param    {function}             handler   - the handler function to remove
   * @return   {bool}                           - if removal was sucessfull
   */
  KeylimeConstructor.prototype.off = function off(event, handler) {
    var eventName, result;

    if (arguments.length === 3) {
      eventName = arguments[1];
      handler = arguments[2];
    }

    assert(typeof event === 'string', 'An event name is required to remove a handler.');
    assert(typeof handler === 'function', 'An function is required to remove a handler.');

    switch (event.toLowerCase()) {
      case 'init':
        result = this.descriptor.removeInitHandler(handler);
        break;
      case 'attr':
        result = this.descriptor.removeAttrHandler(eventName, handler);
        break;
    }

    return result;
  };

  /**
   * Resets all handlers for a particual event.
   * (non-chainable method)
   *
   * @param    {string}               event     - the event name to remove handlers from
   * @return   {*}                              - the handlers that were removed (if any)
   */
  KeylimeConstructor.prototype.offAny = function offAny(event, attrName) {
    var result;

    assert(typeof event === 'string', 'An event name is required to remove all handlers.');

    switch (event.toLowerCase()) {
      case 'init':
        this.descriptor.removeAllInitHandlers();
        break;
      case 'attr':
        this.descriptor.removeAllAttrHandlers(attrName);
        break;
    }

    return result;
  };


  // MARK ---------------------- KeylimeDescriptor --------------------------

  /**
   * KeylimeDescriptor contains information on how to build an instance of a KeylimeConstructor.
   * Each KeylimeConstructor will have 1 KeylimeDescriptor. KeylimeDescriptor is also what
   * contains all the APIs and data for things like attributes.
   *
   * @param {object} [attrs] - a map of attributes to set the descriptor to
   */
  function KeylimeDescriptor(attrs) {
    this.attributes = (attrs !== null && typeof attrs === 'object') ? attrs : {};
    this.initializers = null;
  }

  /**
   * Sets attribute values on a given object using the descriptor's attributes map. Accepts an
   * optional overrides parameter.
   *
   * @param   {object}    target      - object to set properties on
   * @param   {object}    [values]    - optional overrides object
   * @return  {object}                - target object (same ref)
   */
  KeylimeDescriptor.prototype.init = function init(target, values) {
    setAttributesUsingMapAndValues(target, this.attributes, values);

    if (this.initializers && typeof this.initializers === 'function') {
      this.initializers(target);
    } else if (isArray(this.initializers)) {
      for(var i=0; i<this.initializers.length; i++) {
        this.initializers[i](target);
      }
    }

    return target;
  };

  /**
   * Sets a new attribute on the descriptor
   *
   * @param  {string}              name           - name of attribute to create
   * @param  {*}                  [defaultValue]  - default value to use for attribute
   * @param  {object}             [options]       - any arbitrary options to set the
   * @return {KeylimeDescriptor}                  - the current instance
   */
  KeylimeDescriptor.prototype.setAttr = function setAttr(name, defaultValue, options) {
    assert(typeof name === 'string', 'A \'name\' string is required to create an attribute.');
    this.attributes[name] = {
      name: name,
      defaultValue: defaultValue
    };
    extend(this.attributes[name], options);
    return this;
  };

  /**
   * Gets an attribute by name.
   *
   * @param  {string}   name  - name of attribute to fetch
   * @return {object}         - attribute object
   */
  KeylimeDescriptor.prototype.getAttr = function getAttr(name) {
    assert(typeof name === 'string', 'A \'name\' string is required to get an attribute.');
    return this.attributes[name];
  };

  /**
   * Gets a default value for an attribute by name
   *
   * @param  {string}   name    - name of attribute to get default value for
   * @return {*}                - the default value of the attribute
   */
  KeylimeDescriptor.prototype.getDefaultValueFor = function getDefaultValueFor(name) {
    var defaultValue;

    assert(typeof name === 'string', 'A \'name\' string is required to get an attribute defaultValue.');

    if (this.attributes[name]) {
      defaultValue = this.attributes[name].defaultValue;
    }

    return defaultValue;
  };

  /**
   * Sets a handler function to be called upon .init().
   *
   * Initializers are blocking, and do have a performance hit, but the API convinience is worthwile.
   * If you are wanting to execute logic when *attributes* are set, use addAttrHandler instead.
   *
   * @param   {function}    handler     - the handler to add.
   * @return  {KeylimeDescriptor}       - the same instance
   */
  KeylimeDescriptor.prototype.addInitHandler = function addInitHandler(handler) {
    assert(typeof handler === 'function', 'A function is required to set an init handler!');

    if (!this.initializers) {
      this.initializers = handler;
    } else if (typeof this.initializers === 'function') {
      this.initializers = [this.initializers];
      this.initializers.push(handler);
    } else if (isArray(this.initializers)) {
      this.initializers.push(handler);
    }

    return this;
  };

  /**
   * Removes an handler function from the initializers list.
   *
   * @param     {function}      handler     - reference to handler to be removed
   * @return    {bool}                      - if handler was removed succesfully
   */
  KeylimeDescriptor.prototype.removeInitHandler = function removeInitHandler(handler) {
    var newInits;

    assert(typeof handler === 'function', 'A function reference is required to remove an init handler.');

    if (this.initializers === handler) {
      this.initializers = null;
      return true;
    } else if (isArray(this.initializers)) {
      newInits = [];

      for(var i=0; i<this.initializers.length; i++) {
        if (this.initializers[i] !== handler) {
          newInits.push(this.initializers[i]);
        }
      }

      if (newInits.length <= 0) {
        this.initializers = null;
      } else {
        this.initializers = newInits;
      }

      return true;
    }

    return false;
  };

  /**
   * Removes all handlers from the initializers list.
   *
   * @return {function|array|null}      - the handlers that were removed;
   */
  KeylimeDescriptor.prototype.removeAllInitHandlers = function removeAllInitHandlers() {
    var handlers = this.initializers;
    this.initializers = null;
    return handlers;
  };

  /**
   * Sets a handler functon for an attribute by name. Handler functions will get executed when the
   * attribute is being set on every new instance (see setAttributesUsingMapAndValues).
   *
   * Attribute handlers do have a performance cost, but are the most effecient way for includes to
   * modify attributes after instances are created.
   *
   * @param   {string}      attrName      - the name of the attribute to set the handler on
   * @param   {function}    handler       - the handler function to set
   * @return  {KeylimeDescriptor}         - the same instance.
   */
  KeylimeDescriptor.prototype.addAttrHandler = function addAttrHandler(attrName, handler) {
    var attr;

    assert(typeof attrName === 'string', 'A \'name\' is required to set a handler on an attribute.');
    assert(typeof handler === 'function', 'A function is required to set a handler on an attribute.');
    assert(this.attributes[attrName], 'No attribute found for \''+attrName+'\'. Cannot set handler.');

    attr = this.attributes[attrName];

    if (!attr.handlers) {
      attr.handlers = handler;
    } else if (typeof attr.handlers === 'function') {
      attr.handlers = [attr.handlers];
      attr.handlers.push(handler);
    } else if (isArray(attr.handlers)) {
      attr.handlers.push(handler);
    }

    return this;
  };

  /**
   * Removes all handlers from an attribute.
   *
   * @param   {string}      attrName            - name of attribute to remove all handlers from
   * @return  {function|array|null|undefined}   - reference to the handlers that were removed
   */
  KeylimeDescriptor.prototype.removeAllAttrHandlers = function removeAllAttrHandlers(attrName) {
    var handlers;

    if (this.attributes[attrName]) {
      handlers = this.attributes[attrName].handlers;
      this.attributes[attrName].handlers = null;
    }

    return handlers;
  };

  /**
   * Removes specific handler functions from an attribute.
   *
   * @param   {string}      attrName      - name of attribute to remove all handlers from
   * @param   {function}    handler       - handler to remove (checked by reference)
   * @return  {bool}                      - true/false if removal was successful
   */
  KeylimeDescriptor.prototype.removeAttrHandler = function removeAttrHandler(attrName, handler) {
    var attr, newHandlers;

    assert(typeof attrName === 'string', 'A \'name\' is required to remove a handler from an attribute.');
    assert(typeof handler === 'function', 'A function reference is required to remove a handler from an attribute.');

    attr = this.attributes[attrName];

    if (attr && attr.handlers) {
      if (attr.handlers === handler) {
        attr.handlers = null;
        return true;
      } else if (isArray(attr.handlers)) {
        newHandlers = [];

        for (var i=0; i < attr.handlers.length; i++) {
          if (attr.handlers[i] !== handler) {
            newHandlers.push(attr.handlers[i]);
          }
        }

        if (newHandlers.length <= 0) {
          attr.handlers = null;
        } else {
          attr.handlers = newHandlers;
        }

        return true;
      }
    }

    return false;
  };


  // MARK -------------------------- Core --------------------------

  /**
   * Creates a constructor function with a given name. Unless This is only important for debugging
   * purposes, so that objects created by the function have a name, and don't just say "Object".
   *
   * I don't really like using eval here, but I don't know of any other way to dynamically set a
   * function's name. If you do, please send me a pull-request!
   *
   * @param  {string}     name                  - name to set the function to
   * @param  {bool}       [runKeylime=true]     - try to initialize keylime attributes
   * @return {function}                         - named function
   */
  function createNamedConstructor(name, runKeylime) {
    assert(typeof name === 'string', 'A \'name\' string is required to create a named constructor.');

    return eval([
      'function ',name,'(attrs) {',
        'if (!this || !(this instanceof ',name,')) {',
          'throw new Error("Cannot call constructor without the \'new\' keyword!");',
        '}',
        (runKeylime === false) ? '' : 'if (this.keylime) { this.keylime.init(this, attrs); }',
      '}; ',name
    ].join(''));
  }

  /**
   * Converts an existing constructor function to be a "keylime" one (so that it gets all the
   * chain-able methods like .attr, .method, etc).
   *
   * This works by swapping out the constructor's Function.prototype with KeylimeConstructor.
   * KeylimeConstructor is a special type of function that holds all the APIs for building
   * constructors.
   *
   * @param  {function}             constructor   - the function to convert
   * @param  {object}               [attrs]       - optional attributes map
   * @return {KeylimeConstructor}                 - converted function (same ref as constructor)
   */
  function convertConstructorToKeylime(constructor, attrs) {
    assert(typeof constructor === 'function', 'A function parameter is required to convert to a KeylimeConstructor');

    constructor.__proto__ = KeylimeConstructor.prototype;
    constructor.descriptor = new KeylimeDescriptor(attrs);

    Object.defineProperty(constructor.prototype, 'keylime', {
      value: constructor.descriptor
    });

    return constructor;
  }

  /**
   * Set properties & values on an object using an "attributes map", and optional overwrite values.
   * Reference types will get automatically copied (not shared), and functions will get invoked to
   * derive a value for the property.
   *
   * @param   {object}    target      - target object to set values on
   * @param   {object}    map         - attributes map object to use for setting values
   * @param   {object}    [values]    - optional overwrite attributes
   * @return  {object}    target      - target object (same ref)
   */
  function setAttributesUsingMapAndValues(target, map, values) {
    var mapEntry, value;

    assert(typeof target === 'object', 'A \'target\' object is required to set attribute values.');

    for (var mapKey in map) {
      if (map.hasOwnProperty(mapKey)) {
        mapEntry = map[mapKey];
        if (values && values[mapEntry.name] !== undefined) {
          value = values[mapEntry.name];
        } else {
          switch(mapEntry.copyMode) {
            case 'shallow':
              value = clone(mapEntry.defaultValue);
              break;
            case 'deep':
              value = clone(mapEntry.defaultValue, true);
              break;
            default:
              value = mapEntry.defaultValue;
              break;
          }
        }

        if (typeof value === 'function') {
          value = value();
        }

        if (mapEntry.handlers) {
          if (typeof mapEntry.handlers === 'function') {
            value = mapEntry.handlers(value, target, mapEntry);
          } else if (isArray(mapEntry.handlers)) {
            for(var i=0; i < mapEntry.handlers.length; i++) {
              value = mapEntry.handlers[i](value, target, mapEntry);
            }
          }
        }

        target[mapEntry.name] = value;
      }
    }

    return target;
  }

  /**
   * Set attributes on an object, using the data stored in a KeylimeConstructors attributes map.
   * Keylime will try to look up the map using the targets prototype, if the 3rd argment is omited.
   *
   * @param   {object}                instance        - target object to set values on
   * @param   {object}                [overwrites]    - optional attribute overwrites object
   * @param   {KeylimeConstructor}    [constructor]   - optional KeylimeConstructor to use for setting attributes
   * @return  {object}                instance        - target object (same ref)
   */
  function setAttributesForInstance(instance, overwrites, constructor) {
    var attrsMap = null;

    if (constructor instanceof KeylimeConstructor) {
      attrsMap = constructor.getAttrs();
    } else if (instance.keylime !== undefined) {
      attrsMap = instance.keylime.attributes;
    }

    assert(attrsMap !== null && typeof attrsMap === 'object', 'You must supply an instance of a Keylime constructor, or the constructor itself to set attributes.');

    return setAttributesUsingMapAndValues(instance, attrsMap, overwrites);
  }


  // MARK ------------------------ Utilities --------------------------

  /**
   * Extend target object with properties from N... objects.
   *
   * @param {object}        - target object to extend
   * @param {...object}     - objects values to extend target with
   * @return {object}       - target (same ref)
   */
  function extend() {
    var args = [].slice.call(arguments);

    args[0] = (typeof args[0] === 'object') ? args[0] : {};

    for (var i=1; i<args.length; i++) {
      if (typeof args[i] === 'object') {
        for (var key in args[i]) {
          if (args[i].hasOwnProperty(key)) {
            args[0][key] = args[i][key];
          }
        }
      }
    }

    return args[0];
  }

  /**
   * Object cloning with optional deep support
   *
   * @param  {*}      value   - the object to clone
   * @param  {bool}   deep    - perform deep cloning
   * @return {*}              - the cloned object
   */
  function clone(value, deep) {
    var boo = '[object Boolean]';
    var num = '[object Number]';
    var str = '[object String]';
    var obj = '[object Object]';
    var arr = '[object Array]';
    var date = '[object Date]';
    var reg = '[object RegExp]';
    var klass;
    var cloned;

    if (typeof value != 'object') {
      return value;
    }

    klass = Object.prototype.toString.call(value);

    switch (klass) {
      case reg:
        cloned = new value.constructor(value.source, /\w*$/.exec(value));
        cloned.lastIndex = value.lastIndex;
        break;
      case boo:
      case date:
        cloned = new value.constructor(+value);
        break;
      case num:
      case str:
        cloned = new value.constructor(value);
        break;
      case arr:
        cloned = new value.constructor();
        for(var i=0; i < value.length; i++) {
          if (deep) {
            cloned.push(clone(value[i], deep));
          } else {
            cloned.push(value[i]);
          }
        }
        break;
      case obj:
        cloned = new value.constructor();
        for (var key in value) {
          if (value.hasOwnProperty(key)) {
            if (deep) {
              cloned[key] = clone(value[key], deep);
            } else {
              cloned[key] = value[key];
            }
          }
        }
        break;
      default:
        cloned = value;
        break;
    }

    return cloned;
  }


  // MARK -------------------------- Extensions Interface -----------------------

  /**
   * Registers a new extension with keylime. This provides an easy API for consumers to register
   * keylime "extensions" that automatically become part of Keylime's chainable syntax. It also
   * should not have any negative effects on keylime as a whole, since the extension functions don't
   * get invoked until the extension actually gets called.
   *
   * This works by extending the KeylimeConstructor.prototype object with a wrapper version of the
   * extension function.
   *
   * @param   {string}      name        - the name of the extension to register
   * @param   {function}    extension   - the extension function to register
   * @return  {bool}                    - if the extension was registered
   */
  function registerExtension(name, extension) {
    assert(typeof name === 'string', 'You must supply a \'name\' parameter to register a new Keylime extension.');
    assert(typeof extension === 'function', 'You must supply a \'function\' parameter to register a new Keylime extension.');
    assert(KeylimeConstructor.prototype[name] === undefined, 'Cannot register an extension using the name \''+name+'\', it already exists!');
    KeylimeConstructor.prototype[name] = function keylimeExtension() {
      var args = [].slice.call(arguments);
      args.unshift(this);
      extension.apply(extension, args);
      return this;
    };
    return true;
  }

  /**
   * Un-registers a extension function with Keylime.
   *
   * @param   {string}    name      - the name of the extension to unregister
   * @return  {bool}                - if the extension was unregistered (false if not present)
   */
  function unregisterExtension(name) {
    assert(typeof name === 'string', 'You must supply a \'name\' parameter to un-register a Keylime extension.');
    if (!KeylimeConstructor.prototype[name]) {
      return false;
    }
    KeylimeConstructor.prototype[name] = undefined;
    return true;
  }


  // MARK -------------------------- KeylimeError --------------------------

  /**
   * KeylimeError is used for API consumers to easily catch errors that originate from Keylime.
   *
   * @param {string}    message   - error message
   */
  function KeylimeError(msg) {
    this.message = msg;
  }
  KeylimeError.prototype.__proto__ = Error.prototype;


  // MARK -------------------------- Internal --------------------------

  /**
   * Extension for doing assertions. I know there's lots of packages out there that do this, but I
   * wanted to keep Keylime free of any dependencies.
   *
   * @param  {bool}     condition   - assertion value
   * @param  {string}   message     - error message
   */
  function assert(condition, message) {
    if (!condition) {
      throw new KeylimeError(message);
    }
  }

  /**
   * Extension for testing if objects are arrays.
   *
   * @param  {*}      obj   - object to test
   * @param  {bool}         - error message
   */
  function isArray(obj) {
    if (obj && Object.prototype.toString.call(obj) === '[object Array]') {
      return true;
    }

    return false;
  }


  // MARK --------------------------- Exports ----------------------------

  keylime.version = '1.0.0';

  keylime.registerExtension = registerExtension;
  keylime.unregisterExtension = unregisterExtension;

  keylime.util = {
    clone: clone,
    extend: extend
  };

  keylime.core = {
    createNamedConstructor: createNamedConstructor,
    convertConstructorToKeylime: convertConstructorToKeylime,
    setAttributesUsingMapAndValues: setAttributesUsingMapAndValues,
    setAttributesForInstance: setAttributesForInstance
  };

  keylime.prototypes = {
    KeylimeConstructor: KeylimeConstructor,
    KeylimeDescriptor: KeylimeDescriptor,
    KeylimeError: KeylimeError
  };

  return keylime;
}));
