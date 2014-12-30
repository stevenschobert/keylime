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

  /**
   * The keylime serves as both the namespace for exporting APIs, and a convinience function
   * for creating/converting constructors to interface with Keylime.
   */
  function keylime(nameOrFunc) {
    if (typeof nameOrFunc === 'string') {
      nameOrFunc = createNamedConstructor(nameOrFunc);
    }
    return convertConstructorToKeylime(nameOrFunc);
  }


  // MARK - KeylimeConstructor

  /**
   * KeylimeConsturctor contains all the APIs for building prototypes. This is where the chain-able
   * syntax comes from.
   *
   * Orignally, I added those APIs by .bind()'ing them to functions. Instead, I created
   * KeylimeConstructor so that it can be used as the prototype for any function, and have access to
   * the APIs through the prototype chain.
   */
  KeylimeConstructor.prototype.__proto__ = Function.prototype;
  function KeylimeConstructor(attrs) {
    this.descriptor = new KeylimeDescriptor(attrs);
    this.prototype = this.prototype || {};
    Object.defineProperty(this.prototype, 'keylime', {
      value: this.descriptor
    });
  }

  /**
   * Adds an "attribute" to the prototype map. Attributes are regarded as "instance properties", and
   * will be added to each new object the constructor creates.
   */
  KeylimeConstructor.prototype.attr = function attr(name, defaultValue, options) {
    this.descriptor.setAttr(name, defaultValue, extend({copyMode: 'deep'}, options));
    return this;
  };

  /**
   * Returns the "attributes" map of the constructor. Though you can technically access the
   * attributes by simply using .prototype.__keylime__.attrs, I prefer to expose methods so that I
   * have a place to add additional logic down the road if I need to.
   */
  KeylimeConstructor.prototype.getAttrs = function getAttrs() {
    return this.descriptor.attributes;
  };


  // MARK - KeylimeDescriptor

  /**
   * KeylimeDescriptor contains information on how to build an instance of a KeylimeConstructor.
   * Each KeylimeConstructor will have 1 KeylimeDescriptor.
   *
   * KeylimeDescriptor is always what contains all the APIs and data for things like attributes.
   */
  function KeylimeDescriptor(attrs) {
    this.attributes = (attrs !== null && typeof attrs === 'object') ? attrs : {};
  }

  /**
   * Sets an new attribute on the descriptor
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
   * Gets an attribute descriptor by name.
   */
  KeylimeDescriptor.prototype.getAttr = function getAttr(name) {
    assert(typeof name === 'string', 'A \'name\' string is required to get an attribute.');
    return this.attributes[name];
  };

  /**
   * Gets a default value for an attribute by name
   */
  KeylimeDescriptor.prototype.getDefaultValueFor = function getDefaultValueFor(name) {
    var defaultValue;

    assert(typeof name === 'string', 'A \'name\' string is required to get an attribute defaultValue.');

    if (this.attributes[name]) {
      defaultValue = this.attributes[name].defaultValue;
    }

    return defaultValue;
  };


  // MARK - Core functions

  /**
   * Creates a constructor function with a given name. This is only important for debugging
   * purposes, so that objects created by the function have a name, and don't just say "Object".
   *
   * I don't really like using eval here, but I don't know of any other way to dynamically set a
   * function's name. If you do, please send me a pull-request!
   */
  function createNamedConstructor(name) {
    assert(typeof name === 'string', 'A \'name\' string is required to create a named constructor.');

    return eval([
      'function ',name,'() {',
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
          target[mapEntry.name] = value();
        } else {
          target[mapEntry.name] = value;
        }
      }
    }

    return target;
  }

  /**
   * Set attributes on an object, using the data stored in a KeylimeConstructors attributes map.
   * Keylime will try to look up the map using the targets prototype, if the 3rd argment is omited.
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


  // MARK - Utility functions

  /**
   * Extend target object with properties from N... objects.
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
   */
  function clone(value, deep) {
    var klass = Object.prototype.toString.call(value);
    var boo = '[object Boolean]';
    var num = '[object Number]';
    var str = '[object String]';
    var obj = '[object Object]';
    var arr = '[object Array]';
    var date = '[object Date]';
    var reg = '[object RegExp]';
    var cloned;

    if (typeof value != 'object') {
      return value;
    }

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


  // MARK - KeylimeError

  function KeylimeError(msg) { this.message = msg; }
  KeylimeError.prototype.__proto__ = Error.prototype;


  // MARK - Internal functions (not exported)


  /**
   * Helper for doing assertions. I know there's lots of packages out there that do this, but I
   * wanted to keep Keylime free of any dependencies.
   */
  function assert(condition, message) {
    if (!condition) {
      throw new KeylimeError(message);
    }
  }

  /**
   * Check if object is an array.
   */
  function isArray(val) {
    return typeof val === 'object' && Object.prototype.toString.call(val) === '[object Array]';
  }

  return keylime;
}));
