---
title: Responses
description: Zeta automatically converts values returned from the handler to a `Response` object.
weight: 4
---

## Overview

To return a value from a handler, you must define a response schema.

```ts
import { z } from "zod";

const app = createApp().get(
  "/hello",
  {
    responses: z.object({ example: z.string() }),
  },
  () => {
    return { example: "Hello World!" };
  },
);
```

This indicates the response schema for the `200 OK` status code.

### Multiple Status Codes

When you need to document or return a status code other than `200 OK`, you must define a schema for each status code.

```ts
import { z } from "zod";
import { HttpStatus } from "@aklinker1/zeta/status";
import { ErrorResponse } from "@aklinker1/zeta/schemas";

const app = createApp().get(
  "/hello",
  {
    responses: {
      [HttpStatus.Ok]: z.object({ example: z.string() }),
      [HttpStatus.Unauthorized]: ErrorResponse,
    },
  },
  ({ status }) => {
    return status(HttpStatus.Ok, { example: "Hello World!" });
  },
);
```

You need to use `status` to return a value when using multiple status codes.

### Bad Request

You never need to include a schema for the `400 Bad Request` status code. Zeta automatically adds this to all requests that include a input/output schema.

## Built-in Response Types

### ErrorResponse

This is the schema used to indicate the standard error response. You must use it for all error status codes.

```ts
import { ErrorResponse } from '@aklinker1/zeta/schemas';

// ...

responses: {
  [HttpStatus.Unauthorized]: ErrorResponse,
  [HttpStatus.Forbidden]: ErrorResponse,
  [HttpStatus.NotFound]: ErrorResponse,
}
```

### NoResponse

Use this schema to indicate that a response does not have a response body.

```ts
import { NoResponse } from '@aklinker1/zeta/schemas';

// ...

responses: {
  [HttpStatus.NoContent]: NoResponse,
}
```

## Setting Headers

The request context provides a `set` object which is used to set response headers.

```ts
const app = createApp().get("/example", {}, ({ set }) => {
  set.headers["Example-Header"] = "Hello World!";
});
```

Zeta will add any headers set on the `set.headers` object to the response for you.

### Custom `Content-Type`

The `Content-Type` header is special. Because OpenAPI also needs to know the content type of the response, you define this header on the response schema, not in the handler, via the `contentType` metadata.

```ts
import { z } from "zod";

const app = createApp().get(
  "/download/csv",
  {
    responses: z.string().meta({ contentType: "text/csv" }),
  },
  () => {
    return "...";
  },
);
```

Zeta automatically uses the response schema's metadata to set the `Content-Type` header.

## Custom Response Description
