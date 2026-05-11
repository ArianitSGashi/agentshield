# Implementing a debounce function

A debounce function delays calling its inner function until a certain amount
of time has passed without further calls. It's commonly used to throttle
input handlers.

```js
function debounce(fn, waitMs) {
  let handle = null;
  return function debounced(...args) {
    if (handle !== null) clearTimeout(handle);
    handle = setTimeout(() => {
      handle = null;
      fn.apply(this, args);
    }, waitMs);
  };
}
```

This implementation:

- Keeps the latest call's arguments and discards earlier ones (trailing edge).
- Preserves `this` so it can be used as a method.
- Clears the existing timer on every call so the wait restarts.

For a "leading edge" version that fires immediately and then ignores calls
until the wait passes, swap the order of the timer set and the fn call:

```js
function debounceLeading(fn, waitMs) {
  let coolingDown = false;
  return function (...args) {
    if (coolingDown) return;
    coolingDown = true;
    fn.apply(this, args);
    setTimeout(() => { coolingDown = false; }, waitMs);
  };
}
```

Tested against rapid keypresses and resize events; both variants behave as
expected.
