---
title: Installation
weight: 1
---

## Overview

Zeta is available on both [JSR](https://jsr.io/@aklinker1/zeta) and [NPM](https://www.npmjs.com/package/@aklinker1/zeta):

```sh
bun add @aklinker1/zeta
deno add @aklinker1/zeta
```

## Your First App

Zeta apps require input/output validation and OpenAPI docs. These are two core features required for the app to run:

```ts
// main.ts
import { createApp } from "@aklinker1/zeta";
import { zodSchemaAdapter } from "@aklinker1/zeta/adapters/zod-schema-adapter";
import z from "zod";

const app = createApp({
  // 1. Tell Zeta we're using Zod for validation
  schemaAdapter: zodSchemaAdapter,
  // 2. Provide minimal info to build an OpenAPI spec
  openApi: {
    info: {
      title: "Simple Zeta App",
      version: "1.0.0",
    },
  },
}).get(
  "/",
  {
    // 3. Provide docs and schemas
    description: "Example description",
    responses: z.object({
      message: z.string(),
    }),
  },
  () => {
    // 4. Return the response body
    return { message: "Hello World!" };
  },
);

app.listen(3000, () => console.log("Server started @ http://localhost:3000"));
```

Then run the app:

```sh
bun run main.ts
deno run --allow-net index.ts
```

The app will have three routes:

- [/](http://localhost:3000) &rarr; Returns "hello world" JSON
- [/openapi.json](http://localhost:3000/openapi.json) &rarr; Returns OpenAPI JSON spec
- [/scalar](http://localhost:3000/scalar) &rarr; The Scalar API Reference UI

---

## Next Steps

- [Define more routes](@/server/routes/_index.md) on your app.
- Learn more about [Validation](@/server/validation.md).
- Provide more complete [OpenAPI docs](@/server/openapi.md).
- Break up your app into multiple smaller apps and [compose](@/server/composing-apps.md) them together.
