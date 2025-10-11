# Composing Apps

Zeta is built around the idea of composing multiple, smaller apps together to form a full application.

## Using Other Apps

There are two "types" of apps:

- **Top-level**: The app served over over the port.
- **Child**: A smaller part of your entire application used by the top-level app or other child apps.

Here's a basic example with two apps: `apiApp` and `app`.

- The `apiApp` is a "child" app containing all the `/api/**` endpoints.
- The `app` is the "top-level" app that all child apps are added to and served over a port.

```ts
import { createApp } from '@aklinker1/zeta';

const apiApp = createApp({ prefix: "/api" }) // [!code highlight]
  .get("/health", ...); // [!code highlight]

const app = createApp()
  .use(apiApp); // [!code highlight]

app.listen(3000);
```

Call `app.use` to "add" an app to another app.

We can take this example one step further and add a child app to the `apiApp`:

```ts
import { createApp } from '@aklinker1/zeta';

const usersApp = createApp({ prefix: "/users" }) // [!code ++]
  .get("/", ...) // [!code ++]
  .post("/", ...) // [!code ++]
  .put("/:userId", ...) // [!code ++]
  .delete("/:userId", ...); // [!code ++]

const apiApp = createApp({ prefix: "/api" })
  .get("/health", ...)
  .use(usersApp); // [!code ++]

const app = createApp()
  .use(apiApp);

app.listen(3000);
```

Now, the `/api/users/**` endpoints have been added to your app.

## App Isolation

Each app is isolated from others by default (with the exception of [Global Hooks](/request-life-cycle#hook-types)).

Any hooks or decarations you add to a child app is NOT available to the app that uses that child app.

```ts
const apiApp = createApp({ prefix: "/api" })
  .decorate({ db })

const app = createApp()
  .use(apiApp)
  .get("/example", {}, ({ db }) = > {
    //                    ^^ Type Error: db is not a member of RequestContext<...>
  })
```

This helps keep different parts of your app as small as possible, and each app needs to define what it needs to work.

You can disable this isolation by "exporting" an app. Read the next section about plugins to learn how.

## Plugins

Plugins are a special type of child apps that contain reusable logic that multiple other apps want to share.

### Exporting an App

Apps are isolated by default, and the very definition of a plugin means they can't be isolated. You want any logic or utils defined on a plugin to be available in the parent app.

This is easy to do. Simply call [`App#export`](https://jsr.io/@aklinker1/zeta/doc/~/App#property_export):

```ts
const plugin = createApp().export();
```

### Examples

Authentication and decoration are two common use-cases for plugins.

#### Decoration Plugin

In Zeta, decorating an app simply means adding variables to the request context for handlers to use.

A very common pattern is to define a "dependency tree" of databases, services, and utilities at the beginning of your app.

```ts
const sqlite = await openSqlite(...);
const usersRepo = new UsersRepo({ sqlite });
const usersService = new UsersService({ sqlite, usersRepo });
```

Since these are all variables you have to create once and pass into your app, they're great candidates for decoration:

```ts
const app = createApp()
  .decorate({ sqlite, usersRepo, usersService })
  .get(
    "/api/users",
    {},
    ({ usersService }) => userService.listAll(),
  })
```

After decoration, `usersService` is available in the request handler.

But we want to create a reusable plugin so each app doesn't have to create and call decorate every time:

```ts
// plugins/decorate-context.ts
const sqlite = await openSqlite(...);
const usersRepo = new UsersRepo({ sqlite });
const usersService = new UsersService({ sqlite, usersRepo });

export const decorateContextPlugin = createApp()
  .decorate({ sqlite, usersRepo, usersService })
  .export();
```

Now, since the plugin is exported, we can use it's decorated values in our other apps:

```ts
// main.ts
import { decorateContextPlugin } from './plugins/decorate-context';

const app = createApp()
  .use(decorateContextPlugin)
  .get(
    "/api/users",
    {},
    ({ usersService }) => userService.listAll(),
  })
```

#### Authentication

Unlike services that can be constructed up front, authentication is tightly integrated with individual requests, meaning it can't be decorated the same way.

There are two approaches to implementing auth in Zeta:

1. Create a plugin that, when used by another app, requires authentication for all requests automatically
2. Create a plugin that provides utils that handlers can call to decide what type of auth it requires

For simplicities sake, this example will cover the first approach.

```ts
const AUTH_HEADER_PATTERN = /^Bearer (?<token>.*)$/;

export const requireAuthPlugin = createApp()
  .onTransform(async ({ headers }) => {
    const { token } = headers.match(AUTH_HEADER_PATTERN)?.groups;
    if (!token) throw new UnauthorizedHttpError("Bearer token not provided");

    const session = await getSessionFromToken(token);
    if (!session) throw new UnauthorizedHttpError("Invalid token");

    return { session, token };
  })
  .export();
```

Then, for any app that requires authorization for all it's endpoints, just use the plugin:

```ts
const app = createApp()
  .use(requireAuthPlugin)
  .get("/api/session", {}, ({ session }) => session);
```
