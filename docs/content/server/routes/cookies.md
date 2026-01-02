---
title: Cookies
description: Zeta doesn't provide any functionality around cookies.
weight: 6
---

## Overview

If you need to get or set cookies, you need to do it yourself. Thankfully, cookies are super simple to work with.

I'd recommend using the [`cookie` package from npm](https://www.npmjs.com/package/cookie). Then you just need to use the `Cookie` and `Set-Cookie` headers.

```ts
import { createApp } from "@aklinker1/zeta";
import * as cookie from "cookie";

const SESSION_COOKIE_NAME = "example_session";

export const app = createApp()
  .post(
    "/login",
    {
      description: "Log in a user and set the session cookie.",
      body: z.object({
        username: z.string(),
        password: z.string(),
      }),
    },
    ({ body, request, set }) => {
      const user = await authenticate(body.username, body.password);
      const sessionToken = await generateSessionToken(user);

      set.headers["Set-Cookie"] = cookie.serialize(
        SESSION_COOKIE_NAME,
        sessionToken,
        {
          maxAge: 60 * 60 * 24 * 7, // 7 days
          httpOnly: true,
          secure: true,
          sameSite: "strict",
        },
      );
    },
  )
  .get(
    "/session",
    {
      description: "Get the current session based on the session token.",
    },
    ({ request }) => {
      const cookiesString = request.headers.get("cookie");
      const cookies = cookie.parse(cookiesString);
      const sessionToken = cookies[SESSION_COOKIE_NAME];
      return await getUserFromSessionToken(sessionToken);
    },
  );
```
