---
title: onGlobalRequest
description: This hook is called as soon as each request is received.
weight: 1
---

## Decorate the Context

When you return an object from the hook, the object is merged into the context for subsequent hooks and handlers.

```ts
const ipPlugin = createApp()
  .onGlobalRequest(() => {
    return {
      ip: request.headers.get("x-forwarded-for"),
    };
  })
  .export();
```

## Short-circuiting

It is possible to "short-circuit" the request life cycle by returning a [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) instance. Zeta will immediately respond with the returned response, skipping all subsequent hooks and the handler (other than `onGlobalAfterResponse`).

A good example of this is a CORS plugin. It sets the `Access-Control-Allow-*` headers for all requests and returns an OK response to all `OPTIONS` requests.

```ts
export const corsPlugin = createApp()
  .onGlobalRequest(({ method, set }) => {
    set.headers["Access-Control-Allow-Origin"] = "*";
    if (method === "OPTIONS")
      return new Response(null, { status: HttpStatus.NoContent });
  })
  .export();
```
