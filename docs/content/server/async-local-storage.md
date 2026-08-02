---
title: AsyncLocalStorage
description:
  Store and access per-request data anywhere in the call stack without passing it through function
  parameters.
weight: 8
---

## Overview

Zeta includes built-in support for
[Node.js AsyncLocalStorage](https://nodejs.org/api/async_context.html#class-asynclocalstorage),
which allows you to store and retrieve per-request data anywhere in the call stack without
explicitly passing it through function parameters.

This is particularly useful for:

- **Request ID tracking**: Store a request ID and access it in logs throughout the request lifecycle
- **User context**: Store authenticated user information for use throughout request handling
- **Tracing and telemetry**: Store trace IDs and spans for distributed tracing
- **Request metadata**: Store any per-request data that needs to be accessed in utility functions

## Basic Usage

### Accessing the Store in Handlers

Every request context includes a `store` object that you can use to get and set values:

```ts
import { createApp } from "@aklinker1/zeta";

const app = createApp()
  .onGlobalRequest(({ store }) => {
    // Set a request ID that can be accessed anywhere
    store.set("requestId", crypto.randomUUID());
  })
  .get("/api/users", ({ store }) => {
    // Access the request ID in the handler
    const requestId = store.get("requestId");
    console.log(`[${requestId}] Fetching users`);
    return ["user1", "user2"];
  });
```

### Using `getStore()` Helper

For utility functions or code outside of request handlers, use the `getStore()` function to access
the current request's store:

```ts
import { getStore } from "@aklinker1/zeta";

function logWithRequestId(message: string) {
  const store = getStore();
  const requestId = store.get("requestId");
  console.log(`[${requestId}] ${message}`);
}

const app = createApp()
  .onGlobalRequest(({ store }) => {
    store.set("requestId", crypto.randomUUID());
  })
  .get("/api/data", () => {
    logWithRequestId("Processing request");
    // Can call getStore() anywhere in the call stack
    return { data: "..." };
  });
```

## Store API

The `store` object provides the following methods:

### `get<T>(key: string): T | undefined`

Get a value from the store by key.

```ts
const requestId = store.get<string>("requestId");
const user = store.get<User>("user");
```

### `set<T>(key: string, value: T): void`

Set a value in the store.

```ts
store.set("requestId", "abc-123");
store.set("user", { id: 1, name: "John" });
```

### `has(key: string): boolean`

Check if a key exists in the store.

```ts
if (store.has("user")) {
  console.log("User is authenticated");
}
```

### `delete(key: string): boolean`

Delete a value from the store. Returns `true` if the key was deleted, `false` if it didn't exist.

```ts
store.delete("temporaryData");
```

### `clear(): void`

Clear all values from the store.

```ts
store.clear();
```

### `keys()`, `values()`, `entries()`

Iterate over the store's contents.

```ts
for (const key of store.keys()) {
  console.log(key, store.get(key));
}

for (const [key, value] of store.entries()) {
  console.log(key, value);
}
```

## Common Use Cases

### Request ID Tracking

Track a unique ID for each request and use it throughout your logging:

```ts
import { createApp, getStore } from "@aklinker1/zeta";

function log(level: string, message: string) {
  const store = getStore();
  const requestId = store.get("requestId");
  console.log(`[${requestId}] [${level}] ${message}`);
}

const app = createApp()
  .onGlobalRequest(({ store }) => {
    store.set("requestId", crypto.randomUUID());
    log("INFO", "Request received");
  })
  .get("/api/users", () => {
    log("INFO", "Fetching users from database");
    return ["user1", "user2"];
  });
```

### User Authentication Context

Store authenticated user information and access it anywhere:

```ts
import { createApp, getStore } from "@aklinker1/zeta";

interface User {
  id: number;
  name: string;
  email: string;
}

function getCurrentUser(): User | null {
  const store = getStore();
  return store.get<User>("user") ?? null;
}

function requireAuth(): User {
  const user = getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

const app = createApp()
  .onGlobalRequest(({ store, request }) => {
    // Parse auth token and set user
    const token = request.headers.get("Authorization");
    if (token) {
      const user = validateToken(token); // Your validation logic
      if (user) {
        store.set("user", user);
      }
    }
  })
  .get("/api/profile", () => {
    const user = requireAuth();
    return { profile: user };
  })
  .post("/api/posts", ({ body }) => {
    const user = requireAuth();
    return createPost(user.id, body);
  });
```

### Distributed Tracing

Store trace and span IDs for distributed tracing:

```ts
import { createApp, getStore } from "@aklinker1/zeta";

const app = createApp()
  .onGlobalRequest(({ store, request }) => {
    // Extract or generate trace ID
    const traceId = request.headers.get("X-Trace-ID") ?? crypto.randomUUID();
    store.set("traceId", traceId);
    store.set("spanId", crypto.randomUUID());
  })
  .get("/api/data", async () => {
    const store = getStore();
    const traceId = store.get("traceId");

    // Pass trace ID to downstream services
    const response = await fetch("https://api.example.com/data", {
      headers: { "X-Trace-ID": traceId },
    });

    return response.json();
  });
```

## Important Notes

### Context Isolation

Each request has its own isolated store. Values set in one request will not be visible to other
concurrent requests:

```ts
const app = createApp()
  .onGlobalRequest(({ store }) => {
    store.set("requestId", crypto.randomUUID());
  })
  .get("/test", ({ store }) => {
    // This request ID is unique to this request
    const requestId = store.get("requestId");
    return { requestId };
  });
```

### Error Handling

If you call `getStore()` outside of a request context (e.g., at module initialization), it will
throw an error:

```ts
import { getStore } from "@aklinker1/zeta";

// ❌ This will throw an error - not in request context
const store = getStore();

// ✅ This works - inside request handler
const app = createApp().get("/test", () => {
  const store = getStore();
  return { ok: true };
});
```

### Performance

AsyncLocalStorage has minimal performance overhead. The store is implemented using a native `Map`
and is highly optimized for per-request storage.

## TypeScript Support

The `store` is fully typed. You can use generics to specify the type of values you're storing:

```ts
interface User {
  id: number;
  name: string;
}

// Type-safe get/set
store.set<User>("user", { id: 1, name: "John" });
const user = store.get<User>("user");
```

## See Also

- [Request Life Cycle](@/server/hooks/_index.md) - Learn about request hooks where you can set store
  values
- [onGlobalRequest](@/server/hooks/onGlobalRequest.md) - Use this hook to set store values for every
  request
