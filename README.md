Keylime
=======

> Delicious object modeling in JavaScript

```js
var keylime = require('keylime'),
    Post = keylime('Post');

Post
  .attr('title')
  .attr('date', Date)
  .attr('draft', false);

Post.prototype.isDraft = function() {
  return this.draft;
};

var post = new Post({ title: 'Hello World'});
post.date; //=> Tue Jul 29 2014 16:18:10 GMT-0500 (CDT)
post.isDraft(); //=> false;
```

## API

### keylime(name)

Returns a new Keylime constructor function.

- **name** `string` `required` The name to assign the new constructor function.

Every Keylime constructor has several methods you can call (and chain together) to shape what kind
of objects the constructor creates:

### .attr(name, [default])

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
