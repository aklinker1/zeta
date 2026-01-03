# Zeta

[![JSR](https://jsr.io/badges/@aklinker1/zeta)](https://jsr.io/@aklinker1/zeta) [![NPM Version](https://img.shields.io/npm/v/%40aklinker1%2Fzeta?logo=npm&labelColor=red&color=white)](https://www.npmjs.com/package/@aklinker1/zeta) [![Docs](https://img.shields.io/badge/Docs-blue?logo=readme&logoColor=white)](https://jsr.io/@aklinker1/zeta) [![API Reference](https://img.shields.io/badge/API%20Reference-blue?logo=readme&logoColor=white)](https://jsr.io/@aklinker1/zeta/doc) [![License](https://img.shields.io/github/license/aklinker1/zeta)](https://github.com/aklinker1/zeta/blob/main/LICENSE) [![Changelog](https://img.shields.io/badge/Changelog-blue?logo=github&logoColor=white)](https://github.com/aklinker1/zeta/blob/main/CHANGELOG.md)

Composable, fast, testable, OpenAPI-first backend framework with validation built-in.

```ts
// main.ts
import { createApp } from "@aklinker1/zeta";
import { zodSchemaAdapter } from "@aklinker1/zeta/adapters/zod-schema-adapter";
import { z } from "zod";

const app = createApp({
  schemaAdapter: zodSchemaAdapter,
}).get(
  "/hello",
  {
    operationId: "sayHello",
    summary: "Say Hello",
    description: "A simple hello world example",
    response: z.object({ message: z.string() }),
  },
  () => ({ message: "Hello world!" }),
);

app.listen(3000);
```

```sh
bun run main.ts
deno run --allow-net main.ts
```

**Features**

- ✅ [Standard schema](https://standardschema.dev/) support (Zod, Arktype, Valibot, etc)
- 🧩 Composable apps, plugins, and routes
- 🤖 Type-safe server and client side code
- ❄️ WinterCG compatible
- 🧪 Easy to test
- 📄 OpenAPI docs built-in

## Docs

Visit <https://zeta.aklinker1.io> for the full documentation.
