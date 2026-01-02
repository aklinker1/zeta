---
title: Best Practices
description: There is a "right" way to implement common patterns in Zeta.
weight: 9999
---

## Recommended project structure

For backend-only projects, here's my recommended folder structure:

```plaintext
.
├── src/
│   ├── apis/
│   │   ├── files-api.ts
│   │   ├── users-api.ts
│   │   └── ...
│   ├── plugins/
│   │   ├── dependencies-plugin.ts
│   │   └── ...
│   ├── app.ts
│   ├── dependencies.ts
│   ├── main.ts
│   └── models.ts
├── package.json
├── tsconfig.json
└── ...
```

For full-stack projects:

```plaintext
.
├── app/
│   └── ... (client files)
├── server/
│   ├── apis/
│   │   ├── files-api.ts
│   │   ├── users-api.ts
│   │   └── ...
│   ├── plugins/
│   │   ├── dependencies-plugin.ts
│   │   └── ...
│   ├── app.ts
│   ├── dependencies.ts
│   ├── main.ts
├── shared/
│   └── models.ts
├── package.json
├── tsconfig.json
└── ...
```

## Create the app and listen in separate files

In all the documentation so far, we've shown both creating and listening to the app in the same file for brevity. In a real-world application, you should separate these concerns into different files.

```ts
// app.ts
import { createApp } from "@aklinker1/zeta";

export const app = createApp();
```

```ts
// main.ts
import { app } from "./app";

app.listen(3000);
```

The main idea here is to make it easy to import the app without calling `listen()`.

1. When writing tests, you can import and test it without binding to a port.
2. When creating a client using `@aklinker1/zeta/client`, you don't have to export the app instance from the main file, which doesn't make sense for a script entry point.

## Decorate global services instead of importing them

Building a big application can require lots of services that depend on each other. I've spent a lot of time working on projects of all sizes, and I've figure out my personal preference for how to build these services regardless of the project size.

Create a file, `dependencies.ts`, that builds your "dependency tree" and exports all dependencies you will need:

```ts
export const db = await openDatabase(...);
export const usersRepo = createUsersRepo(db);
export const usersService = createUsersService(db, usersService);
```

Then in Zeta, create a plugin that decorates this object onto the context:

```ts
import { createApp } from "@aklinker1/zeta";
import * as dependencies from "./dependencies";

export const dependenciesPlugin = createApp().decorate(dependencies).export();
```

Then destructure the request context to access a dependency:

```ts
const app = createApp()
  .use(dependenciesPlugin)
  .get("/example", ({ db, usersRepo, usersService, ... }) => {
    // ...
  })
```

Now, why do this over just importing services from `dependencies.ts`?

1. Keep how you get access services consistent - `createUsersRepo` isn't importing `db`, it accepts it as an argument so it can be easily mocked in tests. If you start importing services into your routes, now you have two different patterns for getting access to services. Additionally, it's much easier to create circular dependencies if you're importing other services all over the place.
2. Testing! Accepting dependencies as arguments makes it easy to pass in mocks while testing.
3. By using dependency injection, you can easily swap out one implementation for another without changing the code that uses it.
4. In some cases, you'll have to construct services that depend on the request context. In that case, you'll have to pull those services from the request context anyways, so be consistent.

Now, manually constructing a "dependency tree" as shown above can be tedious, but full-blow DI solutions can be hard to learn and don't work well with TypeScript. I created [`@aklinker1/zero-ioc`](https://jsr.io/@aklinker1/zero-ioc) to create asimple, intuative, DI/IOC container with full type-safety. Try it out!

```ts
// dependencies.ts
import { createContainer } from "@aklinker1/zero-ioc";

const db = await openDatabase();

export const container = createContainer()
  .register({ db })
  .register({ usersRepo: createUsersRepo })
  .register({ usersService: createUsersService });
```

```ts
export const dependenciesPlugin = createApp()
  .decorate(container.resolveAll())
  .export();
```

All it does is automate the process of passing arguments into each service factory/constructor while preventing circular dependencies via TypeScript.

But you can use whatever solution you prefer.

## Use model references for base types, not IO schema

I prefer to create models with the following pattern:

1. Use model references for any base type, whether it's a value or object.
2. Create IO schemas for each route.

```ts
// models.ts
import { z } from "zod";

// Base Types

export const IntId = z.coerce.number().min(0).meta({ ref: "IntId" });
export const Username = z.string().min(2).max(32).meta({ ref: "Username" });
export const Password = z.string().min(8).max(128).meta({ ref: "Password" });
export const Role = z.enum(["admin", "user", "guest"]).meta({ ref: "Role" });
export const User = z.object({
  id: IntId,
  username: Username,
  role: Role,
});

// IO Schemas

export const CreateUserInput = z.object({
  username: Username,
  password: Password,
});
export const CreateUserOutput = User;

export const ListUsersInput = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});
export const ListUsersOutput = z.object({
  items: User.array(),
  total: z.int().min(0),
  prevPage: z.int().min(0).optional(),
  nextPage: z.int().min(0).optional(),
});

export const GetUserInput = z.object({
  id: IntId,
});
export const GetUserOutput = User;

export const UpdateUserInput = z.object({
  id: IntId,
  username: Username,
  password: Password,
});
export const UpdateUserOutput = User;

export const DeleteUserInput = z.object({
  id: IntId,
});
export const DeleteUserOutput = User;
```

This has the following benefits:

1. Only types will be documented in openAPI in the "Models" section, IO schemas will only be documented for each request
2. Provides the optimal level of refs in your OpenAPI spec, keeping it as small as possible
3. Having dedicated IO schemas means you can easily change the required inputs and outputs in a single place. This is especially useful if you are importing these models in client code.
