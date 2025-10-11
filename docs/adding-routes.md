# Adding Routes

You can add a route to an app using any of the following methods:

```ts
const app = createApp()
  .get("/api/users", {}, (ctx) => {})
  .post("/api/users", {}, (ctx) => {})
  .put("/api/users/:id", {}, (ctx) => {})
  .delete("/api/users/:id", {}, (ctx) => {})
  .method("PATCH", "/api/users/:id", {}, (ctx) => {})
  .any("/api/users", {}, (ctx) => {});
```

All route definitions require 4 things:

1. The method used to make the request.
2. The route to match request paths against.
3. Route options (OpenAPI docs, input/output validation), represented above by the empty object, `{}`.
4. Handler function which is executed when a request is received.

## A Real Example

Here's a realistic example of what a route definition might look like:

```ts
import {
  createApp,
  HttpStatus,
  ErrorResponse,
  NotFoundError,
} from "@aklinker1/zeta";
import { z } from "zod";
import { addDbPlugin } from "./plugins/db";

// Define schema's for validation
const User = z.object({
  id: z.string(),
  username: z.string(),
  email: z.email(),
  profileUrl: z.url(),
});
const UpdateUserInput = User.omit({ id: true });

const app = createApp()
  .use(addDbPlugin)
  .put(
    "/api/users/:userId",
    {
      // OpenAPI docs
      operationId: "updateUser",
      summary: "Update User",
      // Validation
      path: z.object({ userId: z.string() }),
      body: UpdateUserInput,
      responses: {
        [HttpStatus.Ok]: User,
        [HttpStatus.NotFound]: ErrorResponse,
      },
    },
    async ({ path, body, status, db }) => {
      const updatedUser = await db.update(path.userId, body);
      if (!updatedUser) throw new NotFoundError("User not found");

      return status(HttpStatus.Ok, updatedUser);
    },
  );
```

:::tip Important Comments

- Some [Best Practices](/best-practices) are ignored to keep the example self-contained.

- Zod schemas are used to validate the input/output of our route.

  > See the [Validation docs](/validation) to learn more about how schemas are used to validate requests.

- This route has multiple responses: a 404 error and a 200 success.

  > See the [Error Handling docs](/error-handling) to learn more about throwing the `NoteFoundError`

  > See the [Validation docs](/validation) to learn more about how responses are validated.

- `addDb` plugin adds `db` to the handler's `ctx` object.
  > See the [Plugin docs](/composing-apps#plugins) for more details about what plugins are and how this is accomplished.

:::
