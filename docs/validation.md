# Validation

[[toc]]

## Overview

Zeta validates request inputs and response outputs for every request.

Any object validation library that implements the [Standard Schema spec](https://standardschema.dev/#what-schema-libraries-implement-the-spec) will work with Zeta! Just add schema's to your route definition:

:::code-group

```ts [Zod]
import { z } from "zod";

const User = z.object({
  id: z.string(),
  username: z.string(),
  email: z.email(),
  profileUrl: z.url(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
const CreateUserInput = User.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const app = createApp().post(
  "/users",
  {
    body: CreateUserInput, // [!code highlight]
    responses: User, // [!code highlight]
  },
  ({ body }) => {
    // ...
  },
);
```

:::

In this case, the `body` variable will have already been validated against the `CreateUserInput` schema before the handler is called.

- If an input is not valid, a `400 Bad Request` response will be sent.
- If the return value is not valid, a `422 Unprocessable Content` will be sent.

## Path Parameters

Internally, Zeta uses [`rou3`](https://www.npmjs.com/package/rou3) to match routes. To add a path parameter, you can use `:name`, `**`, or `**:name`.

:::warning Path parameters are strings!
If your validation framework supports converting strings to other types, like with Zod's [`z.coerce`](https://zod.dev/api?id=coercion) or [`z.stringbool`](https://zod.dev/api?id=stringbool), you can use it to convert the string values to the desired type before the route handler is called.
:::

```ts
import { z } from "zod";

const app = createApp()
  .get(
    "/path/:name",
    {
      // Optional: Add type-safety and validation to the route
      path: z.object({
        name: z.coerce.number(),
      }),
    },
    ({ path }) => {
      console.log(path.name);
    },
  )
  .get(
    "/path/**",
    {
      path: z.object({
        "**": z.string(),
      }),
    },
    async ({ path }) => {
      console.log(path["**"]);
    },
  )
  .get(
    "/path/**:name",
    {
      path: z.object({
        name: z.string(),
      }),
    },
    ({ path }) => {
      console.log(path.name);
    },
  );
```

## Query Parameters

:::warning Query parameters are strings!
If your validation framework supports converting strings to other types, like with Zod's [`z.coerce`](https://zod.dev/api?id=coercion) or [`z.stringbool`](https://zod.dev/api?id=stringbool), you can use it to convert the string values to the desired type before the route handler is called.
:::

```ts
import { z } from "zod";

const app = createApp().get(
  "/users",
  {
    query: z.object({
      search: z.string(),
      sortBy: z.enum(["username", "createdAt"]).default("username"),
      sortDirection: z.enum(["asc", "desc"]).default("asc"),
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(10),
      includeProfile: z.stringbool().default(false),
    }),
  },
  ({ query }) => {
    console.log(query);
    // {
    //   search: '...',
    //   sortBy: 'username',
    //   sortDirection: 'asc',
    //   page: 1,
    //   pageSize: 10
    // }
  },
);
```

## Request Body

Request bodies are assumed to be JSON by default.

```ts
import { z } from "zod";

const app = createApp().post(
  "/users",
  {
    body: z.object({
      username: z.string(),
      email: z.string(),
    }),
  },
  ({ body }) => {
    console.log(body);
  },
);
```

### File Uploads

Your request body should be `FormData`:

```ts
// Server side:
const app = createApp().post(
  "/upload",
  {
    body: z.any() as z.ZodType<FormData>,
  },
  async ({ body }) => {
    const file = body.get("file") as File;

    // Do something with the file, like writing it to the file system:
    const bytes = await file.arrayBuffer();
    await Bun.file(file.name).write(bytes);
  },
);
```

```ts
// Client side:
const file = (event.target as HTMLInputElement).files[0];

const body = new FormData();
body.append("file", file);

const res = await fetch("/upload", {
  method: "POST",
  body,
});
```

## Response Body

You can either define a single response or multiple responses.

- For single response schemas, a `200 OK` status code is assumed.
- When defining multiple schemas for different status codes, instead of returning the value directly, you'll need to return the result of the `status` function.

:::code-group

```ts [Single Response]
import { z } from "zod";

const app = createApp().get(
  "/api/health",
  {
    // Note: The property key is always responses (plural), even when defining a
    // single response schema.
    responses: z.object({
      status: z.literal("up"),
      version: z.string(),
    }),
  },
  () => ({ status: "up", version: "..." }),
);
```

```ts [Multiple Responses]
import { ErrorResponse, createApp, HttpStatus } from "@aklinker1/zeta";
import { NotFoundHttpError } from "@aklinker1/zeta/errors";

const app = createApp().post(
  "/api/users",
  {
    body: UserSchema,
    responses: {
      [HttpStatus.Created]: User,
      [HttpStatus.Conflict]: ErrorResponse,
    },
  },
  async ({ status, body }) => {
    const userExists = await db.doesUserExist(body.email);

    // For error responses, throwing is the recommended approach.
    // Zeta maps the HttpError's status code to the correct response schema.
    if (userExists) {
      throw new HttpError(
        HttpStatus.Conflict,
        "A user with this email already exists.",
      );
    }

    const newUser = await db.createUser(body);

    return status(HttpStatus.Created, newUser);
  },
);
```

:::

### Error Response Schemas

Use `ErrorResponse` as the schema for an error responses. See [Error Handling](/error-handling) for more details.

```ts
import { ErrorResponse } from "@aklinker1/zeta"; // [!code highlight]

const app = createApp().get(
  "/users/:userId",
  {
    responses: {
      [HttpStatus.Ok]: User,
      [HttpStatus.NotFound]: ErrorResponse, // [!code highlight]
    },
  },
  () => {
    // ...
  },
);
```

### No Responses

For statuses like `204 No Content`, use the `NoResponse` schema to send an empty response body:

```ts
import { NoResponse } from "@aklinker1/zeta"; // [!code highlight]

const app = createApp().put(
  "/users/:userId",
  {
    responses: {
      [HttpStatus.NoContent]: NoResponse, // [!code highlight]
    },
  },
  () => {},
);
```

### Redirects

Zeta does not provide any utils for redirects. You should use `NoResponse` for the schema and manually set the `Location` header:

```ts
import { NoResponse } from "@aklinker1/zeta"; // [!code highlight]

const app = createApp().get(
  "/api/auth/login/callback",
  {
    responses: {
      [HttpStatus.Found]: NoResponse, // [!code highlight]
    },
  },
  () => {
    // ...

    set.headers["Location"] = "/home"; // [!code highlight]
    return status(HttpStatus.Found, undefined); // [!code highlight]
  },
);
```

### Response `Content-Type`

Zeta does not set the content type header for you. You have to set it in the handler:

```ts
const app = createApp().get(
  "/csv",
  {
    responses: z.string(),
  },
  ({ set }) => {
    // ...
    set.headers["Content-Type"] = "text/csv";
    return "...";
  },
);
```
