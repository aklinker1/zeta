# Get Started

## Installation

Zeta is installed from JSR:

```sh
bunx jsr add @aklinker1/zeta
deno add @aklinker1/zeta
```

## Quick Start

```ts
// main.ts
import { createApp } from "@aklinker1/zeta";

const app = createApp().get(
  "/",
  {},
  () => {
    return { message: "Hello World!" };
  },
);

app.listen(3000);

console.log("Server running at http://localhost:3000");
```

Run the app:

:::code-group

```sh [Bun]
bun run main.ts
```

```sh [Deno]
deno run --allow-net main.ts
```

:::

Finally, hit the `/` endpoint:

```sh
$ curl -v http://localhost:3000
...
< HTTP/1.1 200 OK
< Content-Type: application/json
< Date: Sun, 28 Sep 2025 03:26:00 GMT
< Content-Length: 26
{"message":"Hello World!"}
```
