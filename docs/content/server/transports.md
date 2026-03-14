---
title: Transports
description: Transports provide access to runtime-specific APIs.
weight: 6
---

By default, Zeta uses `createFetchTransport`. It detects your runtime and provides a minimal transport that supports Bun and Deno.

## Runtime-specific Decorations

The default fetch transport not provide access to runtime-specific APIs. For example, in Bun, you use the `server` arg to setup websockets or get the request IP address:

```ts
Bun.serve({
  fetch: (request, server) => {
    const ip = server.requestIP(request);
    // ...
  },
});
```

To access the same object, you need to provide a custom `transport` then transport-specific APIs will be available in the request context:

```ts
import { createApp } from "@aklinker1/zeta";
import { createBunTransport } from "@aklinker1/zeta/transports/bun-transport";

const app = createApp({
  transport: createBunTransport(),
}).get(({ request, server }) => {
  const ip = server.requestIP(request);
  // ...
});
```

You only have to add the transport once, to your top-level app, and any runtime-specific decorations will be made available in all child-apps as well!

## Transport Options

Some transports also support passing custom options:

```ts
import { createBunTransport } from "@aklinker1/zeta/transports/bun-transport";

const transport = createBunTransport({
  websocket: {
    // ...
  },
});

const app = createApp({
  transport,
});
```
