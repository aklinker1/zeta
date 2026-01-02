---
title: Composing Apps
weight: 4
---

## Top-Level vs Child Apps

As an app grows, you will want to break it up into separate files. Zeta is built purposefully to support this.

There are two types of apps:

- **Top-level app**: This is the root app that you call `listen()` on and add child apps to.
- **Child apps**: These are apps are small and usually scoped to a specific feature or route.

```ts
const apiApp = createApp({
  prefix: "/api",
})
  .get("/health", () => new Response("OK"))

const app = createApp({
  // Some options are only used by the top-level app
  schemaAdapter: ...,
  openApi: ...,
})
  .use(apiApp)
  .mount(fetchStatic())

app.listen(3000);
```

## Isolation

By default, app state is isolated from any children and vise-versa. Any modifications made to the child app are not available in the top-level app:

```ts
const childApp = createApp()
  .decorate({ example: "value" })
  .get("/child/**", ({ example }) => {
    console.log(example); // "value"
  });

const app = createApp()
  .use(childApp)
  .get("/**", ({ example }) => {
    console.log(example); // undefined
  });
```

And modifications made to the top-level app are not available in child apps:

```ts
const childApp = createApp().get("/child/**", ({ example }) => {
  console.log(example); // undefined
});

const app = createApp()
  .decorate({ example: "value" })
  .use(childApp)
  .get("/**", ({ example }) => {
    console.log(example); // "value"
  });
```

Isolation is enforced by the type-system. In both cases, you'll get a type error saying `example` is not available.

## Plugins

Sometimes, you need to reuse logic between child and top-level apps. To do this, you create a "plugin", and add it to any app that needs it.

A "plugin" is just an app, but one that calls `export()` to break the isolation apps have by default:

```ts
const plugin = createApp().decorate({ example: "value" }).export();

const childApp = createApp()
  .use(plugin)
  .get("/child/**", ({ example }) => {
    console.log(example); // "value"
  });

const app = createApp()
  .use(childApp)
  .get("/**", ({ example }) => {
    console.log(example); // undefined
  });
```

Note that the child app is still isolating it's own state from the top-level app. That's why the `example` property is still not available in the top-level app.

You need to also `use` the plugin on the top-level app, or any other child app that needs it:

```ts
const app = createApp()
  .use(plugin)
  .use(childApp)
  .get("/**", ({ example }) => {
    console.log(example); // "value"
  });
```

### Deduplicating Plugins

Zeta automatically deduplicates plugins when they are used multiple times. There is no runtime performance impact to using the same plugin multiple times in different apps that are eventually composed together.

## Order Matters

When you `use` a plugin/child app, add a hook, or decorate the request context, order matters. Modifications like these are only applied to subsequent routes and operations after they are added to the app.

For example, when decorating the context with an `example` property, the value will only be available in routes defined after `decorate()` is called.

```ts
const app = createApp()
  .get("/before", ({ example }) => {
    console.log(example); // undefined
  });
  .decorate({ example: "value" })
  .get("/after", ({ example }) => {
    console.log(example); // "value"
  });
```

Once again, the type-system will help you catch these errors before running your app.

Note that order DOES NOT break isolation. Order only matters within the same app.

```ts
const childApp = createApp().get("/child/**", ({ example }) => {
  console.log(example); // undefined
});

const app = createApp()
  .decorate({ example: "value" })
  .use(childApp)
  .get("/**", ({ example }) => {
    console.log(example); // "value"
  });
```

In this example, even though the child app is added _after_ the context is decorated, the `example` property is not available in the child app.
