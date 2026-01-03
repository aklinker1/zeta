---
title: Defining Routes
sort_by: weight
weight: 1
extra:
  group: Routes
---

## Overview

You can add a route to your app using any of the following methods:

- `App#get`: Add a `GET` route handler.
- `App#post`: Add a `POST` route handler.
- `App#put`: Add a `PUT` route handler.
- `App#delete`: Add a `DELETE` route handler.
- `App#method`: Add a route handler for a custom method.
- `App#any`: Add a route handler for any method at a given path.

```ts
const app = createApp()
  .get("/api/users", {}, async (ctx) => {
    // ...
  })
  .post("/api/users", {}, async (ctx) => {
    // ...
  })
  .put("/api/users/:id", {}, async (ctx) => {
    // ...
  })
  .delete("/api/users/:id", {}, async (ctx) => {
    // ...
  })
  .method("PATCH", "/api/users/:id", {}, async (ctx) => {
    // ...
  })
  .any("/api/users", {}, async (ctx) => {
    // ...
  });
```

**Arguments:**

1. `route` &ndash; The path to match against.
2. `definition` &ndash; Define parameters and OpenAPI docs about the route.
3. `handler` &ndash; The callback function executed when a matching request is received.

## Definition

Document the route using the second argument. This is where all the OpenAPI docs are defined, and where you define the input/output schemas for the route.

```ts
export const app = createApp().get(
  "/api/auth/session",
  {
    // Used in OpenAPI docs
    operationId: "getCurrentSession",
    summary: "Get Current Session",
    description: "Get the session for the currently logged in user.",
    tags: ["Auth"],
    security: [{ bearerAuth: [] }],
    // Used in OpenAPI docs and by Zeta to validate the response body
    responses: {
      [HttpStatus.Ok]: GetCurrentSessionOutput,
      [HttpStatus.Unauthorized]: ErrorResponse,
    },
  },
  (ctx) => {
    // ...
  },
);
```

All available properties are typed, so your editor can tell you what's available.

## Handler Context

The handler function receives "context" as its first argument. This object contains information about the request:

- `route` &ndash; The matched route
- `path` &ndash; The full URL pathname
- `params` &ndash; The parsed path parameters
- `query` &ndash; The parsed query parameters
- `body` &ndash; The parsed request body
- `request` &ndash; The original `Request` instance
- `url` &ndash; The parsed URL
- `set` &ndash; Util for setting response headers
- `status` &ndash; Util for setting the response status

### Decorate

You can add objects, variables, or functions to the request context via [hooks](@/server/hooks/_index.md).

For simple objects, Zeta provides the `decorate` function:

```ts
const db = await openDatabase(...);

const app = createApp()
  .decorate({ db }) // or .decorate("db", db);
  .get("/example", {}, ({ db }) => {
    return await db.query(...);
  })
```

`decorate` is shorthand for returning a value from the [`onTransform` hook](@/server/hooks/onTransform.md):

```ts
const db = await openDatabase(...);

const app = createApp()
  .onTransform(() => ({ db }))
  .get("/example", {}, ({ db }) => {
    return await db.query(...);
  })
```
