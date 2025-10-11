# Testing

The basic idea of testing a Zeta app is to build a server-side `fetch` function for your app and make requests to it.

## Basic Usage

```ts
import { test, expect } from "vitest";
import { app } from "../app";

const fetch = app.build();

test('/api/health should return 200 OK { "status": "up" }', () => {
  const request = new Request("http://localhost/api/health");
  const response = await fetch(request);
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body).toEqual({ status: "up" });
});
```

## Alternatives

This is kinda verbose and not type-safe.

Consider using Zeta's test client or your generated API client instead.

:::code-group

```ts [Zeta's Test Client]
import { test, expect } from "vitest";
import { app } from "../app";
import { createTestAppClient } from "@aklinker1/zeta/client";

const client = createTestAppClient(app);

test('/api/health should return 200 OK { "status": "up" }', () => {
  const body = await client.fetch("GET", "/api/health", {});

  expect(body).toEqual({ status: "up" });
});
```

```ts [Custom]
import { test, expect } from "vitest";
import { app } from "../app";
import { MyApiClient } from "../generated-client";

const serverSideFetch = app.build();
const client = new MyApiClient({
  // If your client supports custom `fetch` functions, you can tell the client
  // to use your app's server-side `fetch` function:
  fetch: (...args) => serverSideFetch(new Request(...args)),
});

test('/api/health should return 200 OK { "status": "up" }', () => {
  const body = await client.getHealth();

  expect(body).toEqual({ status: "up" });
});
```
