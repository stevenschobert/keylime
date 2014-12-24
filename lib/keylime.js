(function() {
  'use strict';

  var keylime = module.exports = {};
  keylime.util = {
    createNamedConstructor: createNamedConstructor
  };

  // MARK - Utility functions

  /**
   * Creates a constructor function with a given name.
   * This is only important for debugging purposes, so
   * that objects created by the function have a name,
   * and don't just say "Object".
   *
   * I don't really like using eval here, but I don't know
   * of any other way to dynamically set a functions name.
   */
  function createNamedConstructor(name) {
    assert(typeof name === 'string', 'A \'name\' string is required to create a named constructor.');

    return eval([
      'function ',name,'() {',
      '}; ',name
    ].join(''));
  }


  // MARK - Internal functions
  function assert(condition, message) {
    if (!condition) {
      throw {
        name: "KeylimeError",
        message: message
      };
    }
  }
}());
