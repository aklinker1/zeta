---
title: Test Client
description: Use Zeta's built-in test client to to test your apps with type-safety.
weight: 2
---

## Overview

The test client uses the same API as the regular [client](@/client/_index.md), but instead of just requiring the app types, it requires the actual app instance be passed in.

Unlike the regular client, which requires your frontend and backend code to be in the same codebase, the test client can be used in standalone-backend applications since it's just testing server code.

Here's an example app:

```ts
// app.ts
import { createApp } from "@aklinker1/zeta";
import { z } from "zod";

const app = createApp().get(
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

And here's some tests for it:

```ts
// app.test.ts
import { createTestClient } from "@aklinker1/zeta/testing";
import { app } from "./app";
import { describe, it } from "bun:test";

const client = createTestClient(app);

describe("App", () => {
  describe("healthCheck", () => {
    it("should return OK", async () => {
      const response = await client.fetch("GET", "/health", {});

      expect(response).toEqual({ status: "OK" });
    });
  });

  describe("Unknown route", () => {
    it("should return 404", async () => {
      // @ts-ignore: Unknown route causing a type error
      const response = client.fetch("GET", "/unknown", {});

      await expect(response).rejects.toMatchObject({
        error: "Not Found",
      });
    });
  });
});
```

Details for how to use the `client` object can be found in Zeta's [Client-side docs](@/client/_index.md).
