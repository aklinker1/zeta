---
title: onGlobalAfterResponse
description: This hook is called on the next tick after returning the response.
weight: 7
---

## Overview

This hook is always called on every request.

- If an error was thrown, the error is available in the context via the `error` property.
- If no error was thrown, the response is available in the context via the `response` property.

A good use-case for this hook is to track response time or log requests in combination with `onGlobalRequest`.

```ts
export const requestLoggerPlugin = createApp()
  .onGlobalRequest(() => {
    return {
      startTime: Date.now(),
    };
  })
  .onGlobalAfterResponse(({ method, route, set, startTime }) => {
    console.log(
      `${method} ${route} -> ${set.status} took ${Date.now() - startTime}ms`,
    );
  })
  .export();
```
