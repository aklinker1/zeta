---
title: Request Life Cycle
description: Hook into the request life cycle to modify the request and/or response before or after handlers are called.
sort_by: weight
weight: 2
extra:
  group: Hooks
---

## Overview

When Zeta receives a request, it goes through a series of steps before and after the route handler is called.

![Request Life Cycle Diagram](/server/hooks/request-life-cycle.svg)

## Global Hooks

Some hooks are "global" and apply to all apps, regardless of which app/plugin they are registered on. Regular hooks only apply to the app they were registered on.

These hooks have "global" in their name:

- [onGlobalRequest](@/server/hooks/onGlobalRequest.md)
- [onGlobalError](@/server/hooks/onGlobalError.md)
- [onGlobalAfterResponse](@/server/hooks/onGlobalAfterResponse.md)

Generally, these should only be used for global tasks, like bug reporting or request logging, that run on every request.
