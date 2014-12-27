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
    createNamedConstructor: createNamedConstructor,
    convertConstructorToKeylime: convertConstructorToKeylime
  };

  keylime.core = {
    KeylimeConstructor: KeylimeConstructor
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
  function KeylimeConstructor() {
  }


  // MARK - Utility functions

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
  function convertConstructorToKeylime(constructor) {
    assert(typeof constructor === 'function', 'A function parameter is required to convert to a KeylimeConstructor');
    constructor.__proto__ = KeylimeConstructor.prototype;
    if (constructor.prototype.__keylime__ === undefined) {
      Object.defineProperty(constructor.prototype, '__keylime__', {
        value: {}
      });
    }
    return constructor;
  }


  // MARK - Internal functions (not exported)

  function KeylimeError(msg) { this.message = msg; }
  KeylimeError.prototype.__proto__ = Error.prototype;

  /**
   * Helper for doing assertions. I know there's lots of packages out there that do this, but I
   * wanted to keep Keylime free of any dependencies.
   */
  function assert(condition, message) {
    if (!condition) {
      throw new KeylimeError(message);
    }
  }

  return keylime;
}));
