---
title: Query Params
weight: 2
---

## Overview

To add query parameters to your endpoint, just add them to the definition:

```ts
const app = createApp().get(
  "/api/movies/:movieId",
  {
    query: z.object({
      sortBy: z.enum(["title-asc", "title-desc" /* ... */]),
    }),
  },
  ({ query }) => {
    console.log(query.sortBy);
    // ...
  },
);
```

Query parameters are available via the context's `query` property.

## Coercing Query Parameters

Similar to path parameters, query parameters are strings by default. Use your validation library to coerce/transform the value into another type:

```ts
const app = createApp().get(
  "/api/movies",
  {
    query: z.object({
      hideWatched: z.stringbool(),
      limit: z.coerce.number().int().min(1).max(100),
    }),
  },
  ({ query }) => {
    console.log(query.hideWatched);
    // ...
  },
);
```
