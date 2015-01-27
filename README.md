Keylime
=======

A delicious way to write prototypal classes in JavaScript.

- Clean, chainable syntax.
- Easily define attributes and methods.
- Create mixins to share behaviour between your objects.
- Use helpers to extend Keylime's syntax.
- Leightweight (~9kb minified). Zero dependencies.

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

## Download

- **[Browser/AMD version](dist/keylime.min.js)** (~9kb minified)

## Installation

In the browser:

```html
<script src="keylime.min.js"></script>
```

Using npm:

```sh
npm install --save keylime
```

In Node.js:

```js
var keylime = require('keylime');
```

Using AMD/Require.js

```js
require(['keylime'], function(keylime) {
  // ...
});
```
