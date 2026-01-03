---
title: Path Params
description: Zeta uses [rou3](https://npmjs.com/package/rou3) internally to route requests to the appropriate handler.
weight: 1
---

## Overview

To add a path parameter to your endpoint, use the `:paramName` syntax in the route and add a schema for it in the endpoint's definition:

```ts
const app = createApp().get(
  "/api/movies/:movieId",
  {
    params: z.object({
      movieId: z.string(),
    }),
  },
  ({ params }) => {
    console.log(params.movieId);
    // ...
  },
);
```

Path parameters are available via the context's `params` property.

## Wildcard Parameters

There are three ways to define a path parameter:

1. `:paramName` &ndash; Named
2. `**` &ndash; Anonymous wildcard
3. `**:paramName` &ndash; Named wildcard

Wildcard parameters accept any number of path segments, and can be accessed by `params["**"]` or `params.paramName`, depending on if it is anonymous or named.

Here's an example using an anonymous wildcard parameter to throw a 404 error if the API endpoint is not found:

```ts
const app = createApp({ prefix: "/api" })
  .get("/health", {}, () => {
    // ...
  })
  // ...
  .any("/**", ({ params }) => {
    throw new NotFoundHttpError(params["**"]);
  });
```

Refer to [rou3's documentation](https://www.npmjs.com/package/rou3) for more details.

## Coercing Path Parameters

Path parameters are `string`s by default. If you want to transform or convert the parameter into a different type, like a `number`, use your validation library to coerce the value:

```ts
const app = createApp().get(
  "/api/movies/:movieId",
  {
    params: z.object({
      movieId: z.coerce.number(),
    }),
  },
  ({ params }) => {
    console.log(params.movieId);
    // ...
  },
);
```
