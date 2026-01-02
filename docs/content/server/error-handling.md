---
title: Error Handling
description: Zeta has built-in error handling.
weight: 6
---

## Overview

By default, all errors thrown inside a handler or hook are mapped to a `500 Internal Server Error` response. The original error will be the `cause`.

```ts
import { HttpError } from "@aklinker1/zeta";

const app = createApp().get("/users", {}, () => {
  throw new Error("TODO");
});
```

```ts
-> GET /users
<- 500 Internal Server Error
<- {
<-   "name": "InternalServerError",
<-   "message": "TODO",
<-   "status": 500,
<-   "cause":  {
<-     "name": "Error",
<-     "message": "TODO"
<-   },
<-   "stack": [...],
<- }
```

Regular `Error` instances are always mapped to a `500 Internal Server Error`. To control the status code, you need to throw a `HttpError`:

```ts
import { HttpError } from "@aklinker1/zeta";
import { HttpStatus } from "@aklinker1/zeta/status";

const app = createApp().get("/users", {}, () => {
  throw new HttpError(HttpStatus.NotImplemented, "TODO");
});
```

```ts
-> GET /users
<- 501 Not Implemented
<- {
<-   "name": "HttpError",
<-   "message": "TODO",
<-   "status": 501,
<-   "stack": [...],
<- }
```

{% alert(type="tip") %}
To disable the stack trace, set `NODE_ENV=production` in the environment variables.
{% end %}

Alternatively, you can use a subclass of `HttpError` so you don't have to manually pass the status into the constructor:

```diff
+import { NotImplementedError } from "@aklinker1/zeta";

const app = createApp().get("/users", {}, () => {
- throw new HttpError(HttpStatus.NotImplemented, "TODO");
+ throw new NotImplementedError("TODO");
});
```
