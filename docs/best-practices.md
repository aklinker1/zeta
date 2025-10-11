# Best Practices

[[toc]]

## Separate `app.ts` and `main.ts` files

I like to create two top-level files for my server:

- `app.ts`: Exports the top-level Zeta app. This is where you add all your child-apps into the top-level app.
- `main.ts`: Imports the app and starts the server.

:::code-group

```ts [app.ts]
import { createApp } from "@aklinker1/zeta";

export const app = createApp();
```

```ts [main.ts]
import { app } from "./app";

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
```

:::

This has several advantages:

- You can create scripts that import the app but don't start the server, like to [generate your OpenAPI JSON spec](/openapi#generating-spec).
- You could create a separate `dev.ts` entrypoint that has custom dev-only features.
- You can write E2E tests without starting the server by importing the `app`.
- You can import your app's types on the client side.

## Add `ref` to all your models

By [setting up schema references](/openapi#ref), you:

- Minimize your schema size.
- Provide names for models that OpenAPI generators can take advantage of to keep type names consistent with the backend.
- Include models in the `/scalar` reference
