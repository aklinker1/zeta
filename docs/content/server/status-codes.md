---
title: Status Codes
weight: 5
---

## Enum

Zeta provides an enum of all standard HTTP status codes. You should use this instead of literal values for readability.

```diff
+import { HttpStatus } from "@aklinker1/zeta/status";

const app = createApp()
  .post(
    "/api/users",
    {
      responses: {
-       201: ListUsersOutput,
-       401: ErrorResponse,
+       [HttpStatus.Created]: ListUsersOutput,
+       [HttpStatus.Unauthorized]: ErrorResponse,
      },
    },
    ({ status }) => {
      // ...

-     return status(201, ...);
+     return status(HttpStatus.Created, ...);
    },
  );
```
