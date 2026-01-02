---
title: onBeforeHandle
description: This hook is called after inputs have been validated and before the route's handler is called.
weight: 3
---

## Decorate the Context

When you return an object from the hook, the object is merged into the context for subsequent hooks and handlers.

A good use-case here is to get an object that is required for all routes added after the hook is registered:

```ts
const usersApp = createApp({ prefix: "/users" })
  .get("/", {}, () => {
    // ...
  })
  .onBeforeHandle(({ params, usersRepo }) => {
    const user = await usersRepo.get(params.userId);
    if (!user) throw new NotFoundHttpError("User not found");

    return { user };
  })
  .get("/:userId", {}, ({ user }) => {
    // ...
  })
  .put("/:userId", {}, ({ user }) => {
    // ...
  });
```

## Short-circuiting

You can short-circuit the request life cycle by returning a `Response` object. All subsequent hooks and handlers will be skipped (except for `onGlobalAfterResponse`).

```ts
const authPlugin = createApp()
  .onBeforeHandle(() => {
    if (someCondition()) return new Response();

    // ...
  })
  .export();
```
