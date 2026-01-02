---
title: onAfterHandle
description: This hook is called after the route's handler is called and before the response is validated.
weight: 4
---

## Modify the Response

Inside this hook, the context has a new property, `response`, which is the value returned by the route's handler.

You can use this hook to modify the response value before it is validated.

```ts
const app = createApp().onAfterHandle(({ response }) => {
  if (response instanceof Map) {
    return Object.fromEntries(response);
  }
});
```

## Short-circuiting

You can short-circuit the request life cycle by returning a `Response` object. All subsequent hooks and handlers will be skipped (except for `onGlobalAfterResponse`).

```ts
const authPlugin = createApp()
  .onAfterHandle(() => {
    if (someCondition()) return new Response();

    // ...
  })
  .export();
```
