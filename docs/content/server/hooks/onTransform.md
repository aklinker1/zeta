---
title: onTransform
description: This hook is called after the route has been matched and before the inputs are validated.
weight: 2
---

## Decorate the Context

When you return an object from the hook, the object is merged into the context for subsequent hooks and handlers.

This is the main purpose of the `onTransform` hook.

```ts
const db = new SomeDatabase();

const depsPlugin = createApp()
  .decorate({
    db,
    userService: new UserService(db),
  })
  .onTransform(({ userService, request }) => {
    return {
      authService: new AuthService(userService, request),
    };
  })
  .export();
```

This is very similar to `decorate`, but `decorate` is only useful when you don't need the request context in your services.

`onTransform` is meant to be used to decorate the context with utilities and services that require knowledge of the request context.

## Modify Inputs

You can also modify the request before inputs are validated.

```ts
const app = createApp().onTransform(({ params }) => {
  // replace "-" with undefined
  if (params.slug === "-") {
    params.slug = undefined;
  }
});
```

{% alert(type="warning") %}
Most validation libraries provide some way of "transforming" input values before the value is validated. I would recommend you use the validation library to accomplish this instead of modifying the inputs in a hook. It provides a consistent, easy way of modifying individual properites at any level of the request.
{% end %}

## Short-circuiting

You can short-circuit the request life cycle by returning a `Response` object. All subsequent hooks and handlers will be skipped (except for `onGlobalAfterResponse`).

```ts
const authPlugin = createApp()
  .onTransform(() => {
    if (someCondition()) return new Response();

    // ...
  })
  .export();
```
