---
title: Validation
description: Zeta supports any [Standard Schema](https://standardschema.dev/schema)-compatible validation library.
weight: 2
---

## Overview

Zeta requires a validation library when defining routes. You need to provide a "schema adapter" to your top-level app to inform Zeta about which library you're using.

The adapter is responsible for converting schemas to JSON schemas and getting metadata about each schema.

## Validation Errors

There are two types of validation errors: input validation and output validation.

### Input Validation

When a client makes a request, Zeta will validate the inputs (body, query, and path params).

If the request is not valid, Zeta will respond with a `400 Bad Request`.

### Output Validation

Zeta's type-system will help ensure you're returning valid response bodies from each request. But if there's a type error or you're getting unexpected data from an external source, you can still return an invalid response.

In these cases, Zeta will respond with a `422 Unprocessable Entity`, indicating the server tried to return an invalid response.

## Validation Libraries

### Zod

> <https://zod.dev/>

Zod is a peer dependency, so you need to install it separately.

```sh
bun add zod
deno add zod
```

```ts
import { createApp } from "@aklinker1/zeta";
import { zodSchemaAdapter } from "@aklinker1/zeta/adapters/zod-schema-adapter";

const app = createApp({
  schemaAdapter: zodSchemaAdapter,
});

app.listen(3000);
```

### Other

Create your own adapter implementing the [`SchemaAdapter` interface](https://jsr.io/@aklinker1/zeta/doc/types/~/SchemaAdapter). Refer to [Zod's implementation](https://github.com/aklinker1/zeta/blob/main/src/adapters/zod-schema-adapter.ts) as an example.

You need to implement 3 functions:

1. `toJsonSchema` returns a JSON schema representation of the given schema.
2. `getMeta` returns metadata about the given schema.
