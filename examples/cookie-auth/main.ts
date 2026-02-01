import {
  createApp,
  ErrorResponse,
  ForbiddenHttpError,
  HttpStatus,
  NoResponse,
  UnauthorizedHttpError,
} from "@aklinker1/zeta";
import * as cookie from "cookie";
import dedent from "dedent";
import z from "zod";
import type { Setter } from "../../src/types";

// Models

enum UserPermission {
  ListUsers,
}

const User = z.object({
  id: z.string(),
  username: z.string().min(2).max(100),
  permissions: z.array(z.enum(UserPermission)),
});
type User = z.infer<typeof User>;

// Hard-code a list of users for the example

const USERS: (User & { password: string })[] = [
  {
    id: "1",
    username: "aaron",
    permissions: [UserPermission.ListUsers],
    password: "aarons-password",
  },
  {
    id: "2",
    username: "tom",
    permissions: [],
    password: "toms-password",
  },
];

// Auth plugin

/**
 * Personally, I'm not a fan of classes in JS, but since this will be created
 * every request, it's a better choice compared to a factory function.
 *
 * In JS, creating class instances is faster than calling a factory function
 * that creates an object.
 */
class Auth {
  // Store session tokens in memory for the example
  private static sessionIdUserMap: Record<string, User> = Object.create(null);

  private SESSION_COOKIE_NAME = "example_session";

  private _sessionId: string | undefined | null = null;

  constructor(private ctx: { request: Request; set: Setter }) {}

  /**
   * The session ID provided in the cookie. `undefined` if not provided.
   */
  get sessionId(): string | undefined {
    if (this._sessionId !== null) return this._sessionId;

    const cookieString = this.ctx.request.headers.get("Cookie");
    if (!cookieString) return;

    return (this._sessionId =
      cookie.parse(cookieString)[this.SESSION_COOKIE_NAME]);
  }

  /**
   * Returns the user if logged in via cookies.
   */
  getUser(): User | undefined {
    if (!this.sessionId) return;
    return Auth.sessionIdUserMap[this.sessionId];
  }

  /**
   * Require the request be authenticated and return the user. Throws a
   * {@link UnauthorizedHttpError} if the session cookie is missing or invalid.
   */
  requireUser(): User {
    if (!this.sessionId) throw new UnauthorizedHttpError("Session missing");

    const user = Auth.sessionIdUserMap[this.sessionId];
    if (!user) {
      this.clearSession();
      throw new UnauthorizedHttpError("Invalid session");
    }

    return user;
  }

  /**
   * Require the request be authenticated AND the authenticated user have the
   * required permission.
   */
  requirePermission(permission: UserPermission): User {
    const user = this.requireUser();
    if (!user.permissions.includes(permission)) throw new ForbiddenHttpError();

    return user;
  }

  /**
   * Create a session, adds the cookie, and returns the session ID.
   */
  createSession(user: User): string {
    const sessionId = crypto.randomUUID();
    Auth.sessionIdUserMap[sessionId] = user;

    this.ctx.set.headers["Set-Cookie"] = cookie.serialize(
      this.SESSION_COOKIE_NAME,
      sessionId,
      {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      },
    );

    return sessionId;
  }

  clearSession(): void {
    if (!this.sessionId) return;

    delete Auth.sessionIdUserMap[this.sessionId];
    this.ctx.set.headers["Set-Cookie"] = cookie.serialize(
      this.SESSION_COOKIE_NAME,
      "",
      {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 0,
      },
    );
  }
}

const authPlugin = createApp()
  .onTransform((ctx) => ({
    // Create an auth object for every request containing helper functions for
    // ensuring the request is authorized.
    auth: new Auth(ctx),
  }))
  .export();

const app = createApp()
  .use(authPlugin)
  .get(
    "/",
    {
      responses: User,
    },
    ({ auth }) => auth.requireUser(),
  )
  .get(
    "/users",
    {
      responses: {
        [HttpStatus.Ok]: User.array(),
        [HttpStatus.Forbidden]: ErrorResponse,
        [HttpStatus.Unauthorized]: ErrorResponse,
      },
    },
    ({ auth, status }) => {
      auth.requirePermission(UserPermission.ListUsers);
      return status(HttpStatus.Ok, USERS);
    },
  )
  .get(
    "/login",
    {
      query: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        [HttpStatus.Found]: NoResponse,
        [HttpStatus.Unauthorized]: ErrorResponse,
      },
    },
    ({ query, set, status, auth }) => {
      const user = USERS.find((user) => user.username === query.username);

      if (!user) throw new UnauthorizedHttpError("Username not found");
      if (user.password !== query.password)
        throw new UnauthorizedHttpError("Incorrect password");

      auth.createSession(user);
      set.headers["Location"] = "/";
      return status(HttpStatus.Found, undefined);
    },
  )
  .get(
    "/logout",
    {
      responses: {
        [HttpStatus.Found]: NoResponse,
      },
    },
    ({ auth, set, status }) => {
      auth.clearSession();
      set.headers["Location"] = "/";
      return status(HttpStatus.Found, undefined);
    },
  );

app.listen(3000, () => {
  console.log(dedent`
    Example server started!

    Try out using cookies for auth:
    1. Visit http://localhost:3000 and get a 401 since you're not logged in.
    2. Log in with tom and you will be redirected to the homepage to see the user details: http://localhost:3000/login?username=tom&password=toms-password
    3. Try to get the list of users, but see you get a 403 because tom is missing the required permission: http://localhost:3000/users
    4. Log out of Tom's account at http://localhost:3000/logout - You will be redirected back to the homepage with a 401
    5. Log in as aaron: http://localhost:3000/login?username=aaron&password=aarons-password
    6. Now you can access the list of users: http://localhost:3000/users
  `);
});
