---
title: Request Body
description: Zeta automatically parses the request body into a useful type based on the `Content-Type` header.
weight: 3
---

## Content Types

The `Content-Type` header is required on all requests with a body. If it is not present, `ctx.body` will always be `undefined`, even when a body was sent.

## JSON

This is the most common content type, and Zeta uses your validation library to validate the body before it reaches the route's handler.

```ts
import { z } from "zod";

const app = createApp().post(
  "/auth/user",
  {
    body: z.object({
      username: z.string().min(2).max(100),
      email: z.email(),
      password: z.string().min(8).max(100),
    }),
  },
  ({ body }) => {
    console.log(body); // { username: "...", email: "...", password: "..." }
  },
);
```

Most of the time the body will be an object, but it can be any valid JSON value, like a number, string, array, boolean, etc.

{% alert(type="warning") %}
Devs forget to set the `Content-Type` header when using `fetch` directly with a JSON body. If you forget, the `body` will be `undefined` in the handler!
{% end %}

## File

Zeta provides a util for parsing single file uploads: [`UploadFileBody`](https://jsr.io/@aklinker1/zeta/doc/schema/~/UploadFileBody). When used as the body schema, the `body` variable will be an instance of the [`File` class](https://developer.mozilla.org/en-US/docs/Web/API/File).

```ts
import { UploadFileBody } from "@aklinker1/zeta/schemas";

const app = createApp().post(
  "/upload",
  {
    body: UploadFileBody,
  },
  ({ body }) => {
    console.log(body); // File { ... }
  },
);
```

On the client side, the body needs to be passed as a [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) object with a single key, `file`:

```ts
const formData = new FormData();
formData.append("file", file);

// No need to set the `Content-Type` header when using FormData
await fetch("/upload", {
  method: "POST",
  body: formData,
});
```

Or you can use Zeta's built-in client which will [build the `FormData` for you](@/client/request-body.md#file-uploads).

## Files

Similar to individual file uploads, Zeta provides a util for uploading `FileList`s: [`UploadFilesBody`](https://jsr.io/@aklinker1/zeta/doc/schema/~/UploadFilesBody).

```ts
import { UploadFilesBody } from "@aklinker1/zeta/schemas";

const app = createApp().post(
  "/upload",
  {
    body: UploadFilesBody,
  },
  ({ body }) => {
    console.log(body); // File[]
  },
);
```

In the handler, instead of a `FileList`, you'll be provided a `File[]`.

On the client side, the body is still `FormData`, but the key is `files` instead:

```ts
const formData = new FormData();
files.forEach((file) => {
  formData.append("files", file);
});

// No need to set the `Content-Type` header when using FormData
await fetch("/upload", {
  method: "POST",
  body: formData,
});
```

And once again, you can use Zeta's built-in client which will [build the `FormData` for you](@/client/request-body.md#file-uploads) based on an input `FileList`.

## FormData

To upload a generic `FormData` object, you can use the [`FormDataBody` util](https://jsr.io/@aklinker1/zeta/doc/schema/~/FormDataBody).

```ts
import { FormDataBody } from "@aklinker1/zeta/schemas";

const app = createApp().post(
  "/upload",
  {
    body: FormDataBody,
  },
  ({ body }) => {
    console.log(body); // FormData { ... }
  },
);
```

## Other

If you need to upload another data type, like CSV, you can do so by adding the `contentType` metadata to your body schema:

```ts
import { z } from "zod";

const app = createApp().post(
  "/upload/csv",
  {
    body: z.string().meta({ contentType: "text/csv" }),
  },
  ({ body }) => {
    console.log(body); // "..."
  },
);
```

Zeta can deserialize the following content types:

- `application/json` &rarr; `any`
- `multipart/form-data` &rarr; `FormData`
- `text/*` &rarr; `string`
- `application/x-www-form-urlencoded` &rarr; `FormData`
- `application/octet-stream` &rarr; `Buffer`

If the content type is not supported, Zeta will throw an error.
