---
title: onMapResponse
description: This is the last hook that is ran before the response is sent to the client, running after the response has been validated.
weight: 5
---

## Building the Response

Most of the time, Zeta is capable of automatically build the `Response` object for you based on the value returned by the handler and it's content type. However, if you come across a situation where Zeta does not support the content type you need, use this hook to build the response manually.

```ts
import { Sharp } from "sharp";

const app = createApp().onMapResponse(({ set, response }) => {
  if (response instanceof Sharp) {
    return new Response(await response.jpeg().toBuffer(), {
      status: set.status,
      headers: {
        ...set.headers,
        "Content-Type": "image/jpeg",
      },
    });
  }
});
```

In this example, we are converting a `Sharp` instance (class storing image modifications) to a response.
