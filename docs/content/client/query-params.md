---
title: Query Params
description: Path parameters are passed in via the third argument's `query` property.
weight: 2
---

## Overview

Query parameters are simple:

```ts
await client.fetch("GET", "/users", {
  query: {
    page: 1,
    limit: 10,
    sortBy: "name-asc",
  },
});
```
