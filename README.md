# Zeta

Personal alternative to [Elysia](https://elysiajs.com/) with better validation support.

## Features

- ✅ Standard schema validation (Zod, Arktype, Typebox, etc)
- ✅ Moduler route definitions
- ✅ Full type safety
- ✅ Type-safe Client
- ✏️ OpenAPI docs built-in (Scalar or Swagger or both)
- ✏️ Plugin system

## Example Usage

```ts
// Server-side
import { createApp } from "@aklinker1/zeta";
import { version } from "../package.json";

const app = createApp({ prefix: "/api" }).get(
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

Bun.serve({
  fetch: app.build(),
});
```

```ts
// Client-side
import type { MyApp } from "../server";

const client = createAppClient<MyApp>();

const res = await client.fetch("GET", "/api/health");
// => { status: "up", version: string }
```
