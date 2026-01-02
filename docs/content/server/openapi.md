---
title: OpenAPI
weight: 3
---

## Overview

Zeta has OpenAPI docs built-in. Just make sure you've added a "schema adapter" to your top-level app. The adapter tells Zeta how to convert input/output models to JSON schemas.

## Endpoints

By default, Zeta serves your OpenAPI spec at `/openapi.json` and the [Scalar API Reference](https://guides.scalar.com/scalar/scalar-api-references/getting-started) at `/scalar`.

In your top-level app, you can configure these endpoints:

```ts
const app = createApp({
  openApiRoute: "/openapi.json",
  scalarRoute: "/scalar",
});

app.listen(3000);
```

## Scalar Config

To configure the scalar UI, pass config into the top-level app's `scalar` option:

```ts
const app = createApp({
  scalar: {
    // Configure Scalar UI options here
  },
});
```

This option is untyped, so refer to [Scalar's documentation](https://guides.scalar.com/scalar/scalar-api-references/configuration) for available options.

## Model References

By default, the OpenAPI spec Zeta generates does not add any models to the `components.schemas` section of the spec. This can lead to duplicate object schemas.

You can move models to the `components.schemas` section and use `$ref` by adding the `ref` metadata to your model:

```ts
import z from "zod";

const User = z
  .object({
    id: z.int(),
    username: z.string(),
    email: z.email(),
    // ...
  })
  .meta({
    ref: "User",
  });

createApp().get(
  "/api/users/:id",
  {
    operationId: "getUser",
    summary: "Get User",
    path: z.object({ id: z.string() }),
    response: User,
  },
  () => {
    // ...
  },
);
```

You can add references to objects, enums, strings, arrays, etc. Any schema you define can have a reference, not just objects.

{% alert(type="tip") %}
All validation libraries support metadata, refer to your library's docs for more information.
{% end %}

## Response Description

Response descriptions default to the HTTP status's text (e.g., "OK" for 200).

You can override this per-response by adding the `responseDescription` metadata to your model:

```ts
export const UserDeleteOutput = z
  .object({
    id: z.int(),
    // ...
  })
  .meta({
    responseDescription: "User was deleted",
  });

createApp().delete(
  "/api/users/:id",
  {
    responses: {
      [HttpStatus.OK]: UserDeleteOutput,
    },
  },
  () => {
    // ...
  },
);
```

{% alert(type="tip") %}
All validation libraries support metadata, refer to your library's docs for more information.
{% end %}
