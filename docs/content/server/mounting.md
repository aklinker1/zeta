---
title: Mount Fetch Functions
description: Zeta is WinterCG compliant, meaning you can mount other standard server-side fetch functions on your app.
weight: 6
---

## Overview

Sometimes, you need to mount other `(request: Request) => MaybePromise<Response>` functions to your app. For example, to include `@aklinker1/aframe`'s utility to fetch static assets:

```ts
import { fetchStatic } from "@aklinker1/aframe/server";

const app = createApp()
  .get("/api/health", ...)
  .mount(fetchStatic())
```

In this case, `fetchStatic()` would be called when a request doesn't match any of the defined routes. You can also mount a `fetch` function at a specific path.

```ts
import { Elysia } from "elysia";
import { Hono } from "hono";

const elysiaApp = new Elysia();
const honoApp = new Hono();

const app = createApp()
  .mount("/elysia", elysiaApp.fetch)
  .mount("/hono", honoApp.fetch);
```

Here, we're mounting some `fetch` functions from other frameworks onto our app. You could also write your own:

```ts
const app = createApp().mount((request) => new Response("Hello, World!"));
```
