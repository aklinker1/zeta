---
title: onGlobalError
description: This hook is called when an error occurs anywhere in the request life cycle, and before the response is sent.
weight: 6
---

## Overview

This hook is meant to be used to log, track, or report errors.

```ts
import { Sentry } from "sentry";

const errorReporterPlugin = createApp()
  .onGlobalError(({ error }) => {
    Sentry.captureException(error);
  })
  .export();
```

You cannot stop an error from being sent to the client at this point. You cannot map the error response to a different object either. All you can do is inspect the error that was thrown.
