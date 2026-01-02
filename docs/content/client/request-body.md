---
title: Request Body
description: The body is passed in via the third argument's `body` property.
weight: 3
---

## Overview

It's easy to include a request body:

```ts
await client.fetch("POST", "/users", {
  body: {
    username: "example",
    password: "example",
    // ...
  },
});
```

## File Uploads

To upload a file, assuming you're using `UploadFileBody` or `UploadFilesBody`, you can do this:

```ts
await client.fetch("POST", "/upload", {
  body: input.files[0],
  // Or to upload multiple files:
  body: input.files,
});
```

## FormData

Just build the `FormData` instance and pass it in:

```ts
const formData = new FormData();
formData.append("key", "value");
await client.fetch("POST", "/form-data", {
  body: formData,
});
```
