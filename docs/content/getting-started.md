---
---

# Getting Started

First install Zeta from [NPM](https://www.npmjs.com/package/@aklinker1/zeta) or [JSR](https://jsr.io/@aklinker1/zeta):

```sh
bun add @aklinker1/zeta
deno add @aklinker1/zeta
```

Then create an app and start it:

```ts
// main.ts
import { createApp } from "@aklinker1/zeta";

const app = createApp().get("/health", () => "OK");

app.listen(3000, () => console.log("Server started on port 3000"));
```

Run the app:

```sh
bun run main.ts
# Or
deno run main.ts
```

And you're done! Open <http://localhost:3000/health> in your browser to verify it's working.
