---
title: App Testing
description: Write unit or integration tests for your apps without binding a port.
sort_by: weight
extra:
  group: Setup
---

## Setup

Here's an example app:

```ts
// app.ts
import { createApp } from "@aklinker1/zeta";
import { z } from "zod";

export const app = createApp().get(
  "/health",
  {
    operationId: "healthCheck",
    responses: z.object({
      status: z.string(),
    }),
  },
  () => ({ status: "OK" }),
);
```

Inside your test file, import your app and call `build()` to create your app's fetch function. Then just call the fetch function with a `Request` object!

```ts
// app.test.ts
import { HttpStatus } from "@aklinker1/zeta/status";
import { app } from "./app";
import { describe, it } from "bun:test";

const fetch = app.build();

describe("App", () => {
  describe("healthCheck", () => {
    it("should return OK", async () => {
      const request = new Request("http://localhost/health");

      const response = await fetch(request);

      expect(response.status).toBe(HttpStatus.Ok);
      expect(await response.json()).toEqual({ status: "OK" });
    });
  });

  describe("Unknown route", () => {
    it("should return 404", async () => {
      const request = new Request("http://localhost/unknown");

      const response = await fetch(request);

      expect(response.status).toBe(HttpStatus.NotFound);
      expect(await response.json()).toMatchObject({
        error: "Not Found",
      });
    });
  });
});
```

{% alert(type="warning") %}
Only call `build()` once per app, otherwise it will throw an error.
{% end %}

Note that `fetch` always returns a `Response`, even if an error is thrown, like when a route is not found.

## Next Steps

Testing the app like this works just fine, but it can be quite tedious to build the `Request` object and parse the response body inside every test. It's important to know you _can_ do this, but Zeta provides a more convenient way to test your app with it's [built-in test client](@/testing/test-client.md).
