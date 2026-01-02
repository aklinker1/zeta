---
title: Error Handling
weight: 4
---

## Overview

When the fetch response is not OK (`response.ok`), Zeta will throw a [RequestError](https://jsr.io/@aklinker1/zeta@1.3.3/doc/client/~/RequestError).

You can get the error message and status code like so:

```ts
try {
  await client.fetch("GET", "/unknown", {});
} catch (error: RequestError) {
  const { status, message } = error.response;
  console.error(error, { status, message });
}
```
