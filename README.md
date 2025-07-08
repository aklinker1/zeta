# Zeta

[![JSR](https://jsr.io/badges/@aklinker1/zeta)](https://jsr.io/@aklinker1/zeta) [![Docs](https://img.shields.io/badge/Docs-blue?logo=readme&logoColor=white)](https://jsr.io/@aklinker1/zeta) [![API Reference](https://img.shields.io/badge/API%20Reference-blue?logo=readme&logoColor=white)](https://jsr.io/@aklinker1/zeta/doc) [![License](https://img.shields.io/github/license/aklinker1/zeta)](https://github.com/aklinker1/zeta/blob/main/LICENSE)

Personal alternative to [Elysia](https://elysiajs.com/) with better validation support.

## Features

- ✅ Standard schema validation (Zod, Arktype, Typebox, etc)
- ✅ Moduler route definitions
- ✅ Full type safety
- ✅ Type-safe Client
- ✅ WinterCG compatible
- ✅ Plugin system
- ✅ OpenAPI docs built-in

## Example Usage

```ts
// Server-side
import { createApp } from "@aklinker1/zeta";
import { zodSchemaAdapter } from "@aklinker1/zeta/adapters/zod-schema-adapter";
import { version } from "../package.json";
import { z } from "zod/v4";

const app = createApp({
  prefix: "/api",
  schemaAdapter: zodSchemaAdapter,
}).get(
  "/health",
  {
    response: z.object({
      status: z.literal("up"),
      version: z.string(),
    }),
  },
  () => ({
    status: "up",
    version,
  }),
);
export type MyApp = typeof app;

app.listen(3000);
```

```ts
// Client-side
import type { MyApp } from "../server";

const client = createAppClient<MyApp>();

const res = await client.fetch("GET", "/api/health");
// => { status: "up", version: string }
```

## Publishing

To publish a new version of Zeta, run:

```sh
bun run publish 0.1.3 # or whatever the new version is
```
