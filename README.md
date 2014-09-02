Keylime
=======

> Delicious object modeling in JavaScript

```js
var keylime = require('keylime'),
    Post = keylime('Post');

Post
  .attr('title')
  .attr('date', Date.now)
  .attr('draft', false)
  .method('isDraft', function isDraft() {
    return this.draft;
  });

var post = new Post({ title: 'Hello World'});
post.date; //=> 1409683731413
post.isDraft(); //=> false
```

## API

### keylime(name)

Returns a new Keylime constructor function.

- **name** `string` `required` The name to assign the new constructor function.

Every Keylime constructor has several methods you can call (and chain together) to shape what kind
of objects the constructor creates:

### .attr(name, default?)

Add a new attribute (or property) to each instance the constructor returns.

- **name** `string` `required` The name of the attribute to add to every instance.
- **default** `any type` `optional` The default value to provide for the attribute. This default
  will be used in the case that no value is provided when invoking the constructor.

```js
var User = keylime('User').attr('active', false),
    joe = new User(),
    larry = new User({active: true});

joe.active; // => false
larry.active; // => true
```

#### Functions as Attributes

You can also use functions to compute attribute values at the time of instantiation. Just return
whatever value you want to assign to the attribute:

```js
var Post = keylime('Post').attr('date', function() {return new Date();}),
    post = new Post();

post.date; //=> Tue Jul 29 2014 16:18:10 GMT-0500 (CDT)
```

### .inherits(Model)

Sets the constructors "parent". All the attributes on the parent constructor will be added when
invoking the child constructor. Also, any methods on the parent's prototype will be shared as well.

- **Model** `function` `required` The constructor to inherit. Must be a Keylime constructor.

This allows you to set up simple inheritance:

```js
var ForceUser = keylime('ForceUser').attr('force', 100),
    Jedi = keylime('Jedi').inherits(ForceUser).attr('side', 'light'),
    luke = new Jedi();

ForceUser.prototype.isPowerful = function() {
  return this.force >= 50;
};

luke.side; // => light
luke.force; // => 100
luke.isPowerful; // => true
```

### .method(name, method)

Adds a named method to the constructors prototype chain.

- **name** `string` `required` The name to use when adding the function to the constructor's
  prototype.
- **method** `function` `required` The function to add to the constructor's prototype. The `this`
  context in the function represents an instance of the constructor.

```js
var Post = keylime('Test');

Post
  .attr('draft', false)
  .method('isDraft', function isDraft() {
    return this.draft;
  });

var post = new Post();
post.isDraft(); // => false
```

### .use(middleware)

Invokes a "middleware" function with the current constructor as an argument. This allows you to
group together constructor functionality in a seperate module or function.

-  **middleware** `function` `required` The function to invoke. Recieves the current constructor as
   the only argument.

### .attrHelper(name, helper)

Adds a new attribute helper to the constructor. The helper function will recieve the last-added attribute
as an argument, as well as any additional arguments passed to the helper.

- **name** `string` `required` The name to use when adding the helper to the constructor.
- **helper** `function` `required` The function to call when the helper is invoked. Recieves the
  last-added attribute as the first argument.

### .init(handler)

Registers a new handler to be called whenever new instances are created.

- **handler** `function` `required` The handler to register. The `this` context is bound to the
  instance being created. Also receives any arguments that were passed to the constructor.

```js
var Astroid = keylime('Astroid');

Astroid
  .attr('size', 'medium')
  .init(function() {
    console.log('New astroid created: ', this);
  });

new Astroid();
// => New astroid created: { size: 'medium' }
new Astroid({size: 'mega'});
// => New astroid created: { size: 'mega' }
```

### .attrs(name?)

> Unlike all the other methods, this one is not chainable, as it returns a value.

Gets one or all of the attributes from the constructor.

- **name** `string` `optional` The name of the attribute to fetch. If not given, all attributes will
  be returned.

```js
var Lightsaber = keylime('Lightsaber');

Lightsaber
  .attr('color')
  .attr('power', 100);

Lightsaber.attrs();         // => { color: { value: null }, power: { value: 100 } }
Lightsaber.attrs('power');  // => { value: 100 }
```
