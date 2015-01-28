<img alt="keylime.js"
src="https://cloud.githubusercontent.com/assets/896486/5949380/babf0f68-a712-11e4-80f3-e4edd8cb4fdc.png" height="93" width="342" />

Keylime
==========

> A delicious way to build prototype objects in JavaScript.

Keylime is library for creating and composing object behavior in JavaScript. Keylime lets you
define the "attributes" and "methods" your object should have, and allows you to abstract away
more complicated logic into easy-to-reuse modules.

## Features

- Clean, chainable syntax.
- Easily define attributes and methods.
- Create mixins to share behaviour between your objects.
- Use helpers to extend Keylime's syntax.
- Great browser support (IE8 and up).
- Leightweight (~9kb minified). Zero dependencies.

## Example

```js
var Jedi = keylime('Jedi')
  .attr('name')
  .attr('side', 'light')
  .attr('powers', ['push', 'jump']);
  .attr('createdAt', Date.now)
  .method('meditate', function meditate() {
    return this.name + ' is meditating...';
  });

var yoda = new Jedi({
  name: 'Yoda'
});

yoda.side;         //=> light
yoda.createdAt;    //=> 1409683731413
yoda.meditate();   //=> 'yoda is meditating'
```

## Why?

[Prototype inheritance](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain),
despite being awesome, is often confusing and/or misunderstood by people who are more familiar with
classical object-oriented patterns. This is clearly evidenced by the `class` keyword being added in
ES6, to make prototypes more familiar for people who know classical inheritance models.

Keylime is an effort to do the same thing. It provides a friendly interface to creating [constructor
functions](http://addyosmani.com/resources/essentialjsdesignpatterns/book/#constructorpatternjavascript).
In addition, Keylime also tries to solve the problem of how logic is shared between different
prototypes and their constructor functions.

## Download

Using the browser:

- **[Browser/AMD version](dist/keylime.min.js)** (~9kb minified)

Using npm:

```sh
npm install --save keylime
```

## Installation

In the browser:

```html
<script src="keylime.min.js"></script>
```

In Node:

```js
var keylime = require('keylime');
```

Using AMD/Require:

```js
require([keylime], function(keylime) {
  // ...
});
```

## Creating a constructor

The top-level Keylime function generates new constructor functions. These functions not only create
new instances for you, but also have special functions that allow you to define how the function
should behave.

```js
var Jedi = keylime('Jedi');
```

> All the following API examples use `Jedi` to refer to a keylime constructor.

## Defining attributes

Keylime allows you to define "attributes" that every instance of the constructor should have, with
optional default values.

```js
// no default value
Jedi.attr('name');

// default value
Jedi.attr('side', 'light');
```

#### Dynamic default values

You can use functions to calculate default values at time of creation:

```js
Jedi.attr('createdAt', function() {
  return Date.now();
});

// or for short:
Jedi.attr('createdAt', Date.now);
```

#### Arrays/Objects as default values

If you set an array or object as the default value, it will be **copied** to every instance, not
shared:

```js
Jedi.attr('powers', ['push', 'jump']);

var obi = new Jedi();
var mace = new Jedi();

obi.powers.push('mind trick');    //=> ['push', 'jump', 'mind trick']
mace.powers;                      //=> ['push', 'jump']
```

## Creating instances

You can create instances of your objects using the either `new` keyword, or you can call the
`.create()` function.

```js
new Jedi();

// or

Jedi.create();
```

#### Setting attributes during creation

Attributes can be passed in an object as the first parameter during creation. Properties that are
not attributes will be filtered out during creation:

```js
var yoda = Jedi({
  name: 'yoda',
  invalidAttr: 10
});

yoda.name;        //=> 'yoda'
yoda.invalidAttr; //=> undefined
```

## Defining Methods

You can define methods on objects, and Keylime will put these methods on the prototype chain for
you. Inside the function body, `this` refers to the instance, like usual.

```js
Jedi.method('meditate', function meditate() {
  return this.name + ' is meditating...';
});

var anakin = new Jedi({
  name: 'anakin'
});

anakin.meditate(); //=> anakin is meditating...
```

## Mixins

Mixins allow you to abstract shared or complex logic into re-usable modules. Think of mixins
similarly to middlewhere. A mixin is a function that receives the constructor it was included in,
and allows you to modify the constructor.

For example, you could create a mixin that defines how HP is managed in characters on a game.

```js
function hp(model, maxHealth, minHealth) {
  model
    .attr('health', maxHealth)

    .method('receiveHeal', function receiveHeal(amount) {
      var newHealth = this.health + amount;
      this.health = (newHealth > maxHealth) ? maxHealth : newHealth;
      return this.health;
    })

    .method('isAlive', function isAlive() {
      return this.health <= minHealth;
    })

    .method('receiveDamage', function receiveDamage(amount) {
      var newHealth = this.health - amount;
      this.health = (newHealth < minHealth) ? minHealth : newHealth;
      return this.health;
    });
}

var Jedi = keylime('Jedi')
  .include(hp, 0, 100)
  .attr('name');

var yoda = new Jedi({
  health: 50
});

yoda.health;              //=> 50
yoda.receiveDamage(80);   //=> 0
yoda.isAlive();           //=> false
```

#### Mixins instead of inheritance

Keylime does not provide any APIs for inheriting other constructors. Instead, Keylime
encourages abstraction through the use of mixins.

For example, instead of creating a base `Character` constructor that defines how healthpoints and
damage are managed, create a `healthpoint` mixin, and include that in your constructors.

Mixins can be used to wrap other libraries, create database adapters, etc.

## Extending Keylime syntax

Keylime allows you to extend the chaining syntax with your own functionality. A Keylime extension
looks identical to a mixin.

Extensions are useful for wrapping other plugins, or providing new ways to describe constructor
functionality. For example, here is an extension wrapping [validate.js](http://validatejs.org):

```js
keylime.registerHelper('validate', function validate(model, constraints) {
  model.constraints = constraints;

  model
    .method('validate', function validate() {
      return validatejs(this, model.constraints);
    })
    .method('isValid', function isValid() {
      return this.validate() === undefined;
    });
});

var Jedi = keylime('Jedi')
  .validate({
    name: {
      presence: true
    }
  })
  .attr('name');

var yoda = new Jedi();

yoda.isValid();      //=> false
yoda.name = 'Yoda';
yoda.isValid();      //=> true
```

## Hooking into object creation cycle

Keylime allows you to hook into object creating through handler functions, similary to handling
events in jQuery.

Unlike event handlers however, these functions *are not* asyncrounous. Keylime will wait for all of
your handlers to finish before returning the new instance. This allows you modify the instance
before the its sent back to the caller.

```js
Jedi.on('init', function(instance) {
  // instance with attributes already set
});
```

#### Modifying attributes during creation

Since Keylime waits for all handler functions to finish before returning new instances, it provides
a special API you should use if you need to modify specific attributes.

This prevents you from having to doing having to loop through attributes in multiple handlers to
update values.

```js
Jedi.on('attr', 'id', function appendTime(idValue) {
  var timestamp = new Date();
  return idValue + '_' + timestamp.toISOString();
});

var yoda = new Jedi({
  id: 'yoda'
});

yoda.id; //=> 'yoda_2015-01-28T21:46:15.574Z'
```

## Credits

Brought to you by [@stevenschobert](https://twitter.com/stevenschobert) and
[@ovenbits](https://twitter.com/ovenbits).<br />Logo by the awesome [@ronniecjohnson](https://twitter.com/ronniecjohnson).

<a href="http://ovenbits.com"><img alt="Oven Bits"
src="https://cloud.githubusercontent.com/assets/896486/5949314/f891fa9a-a711-11e4-89d5-20c73b80aa35.png" width="200" height="200" /></a>
