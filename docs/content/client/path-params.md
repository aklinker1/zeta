---
title: Path Params
description: Path parameters are passed in via the third argument's `params` property.
weight: 1
---

## Overview

Unlike with normal fetch requests, the `route` argument is not the URL. It should be the route string used to define the route in your server code.

Internally, Zeta's client will build the full URL, replacing any path parameters with the values provided in the `input` argument.

```ts
// This fetches "/users/123"
await client.fetch("GET", "/users/:id", {
  params: {
    id: "123",
  },
});
```

For [wildcard parameters](@/server/routes/path-params.md#wildcard-parameters), use `**` or `paramName` for the key:

```ts
await client.fetch("GET", "/users/**", {
  params: {
    "**": "123",
  },
});
// Or for named wildcard parameters
await client.fetch("GET", "/users/**:id", {
  params: {
    id: "123",
  },
});
```
