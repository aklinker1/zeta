---
title: Setup
description: Zeta provides a type-safe client for full-stack apps.
sort_by: weight
extra:
  group: Get Started
---

## Overview

If you're server and client code are in different codebases, you'll have to generate your client using [openapi-generator](https://openapi-generator.tech/docs/generators/typescript-axios) and your OpenAPI spec.

If your server and client code are in the same codebase, you can take advantage of Zeta's built-in, lightweight wrapper around `fetch` to create a type-safe client.

## Built-in Client

It's really easy to use the built-in client. Import `createClient` from `@aklinker1/zeta/client` and provide it your app's type. Here's an example setup:

```ts
// server/app.ts
import { createApp } from "@aklinker1/zeta";

export const app = createApp();
export type App = typeof app;
```

```ts
// app/utils/app-client.ts
import { createClient } from "@aklinker1/zeta/client";
import type { App } from "../server/app";

export const appClient = createClient<App>();
```

{% alert(type="danger") %}
It is extremely important that you use `import type` instead of `import` when importing your app's type. Otherwise, your entire backend code will be included in your frontend JS.
{% end %}

## Usage

Once you have a client, usage is simple. Your client has one function, `fetch`, that accepts three arguments:

1. `method` &ndash; The HTTP method to use when making the request.
2. `route` &ndash; The route to make the request to.
3. `inputs` &ndash; The path params, query params, and request body to send with the request.

The function returns a Promise that resolves to the response body &ndash; no need to call `.json()` or `.text()`.

```ts
const user = await appClient.fetch("GET", "/users/:id", {
  params: {
    id: 1,
  },
});
```
