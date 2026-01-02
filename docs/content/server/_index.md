---
title: Welcome
sort_by: weight
extra:
  group: Get Started
---

## Introduction

Zeta was built to be a simpler alternative to [Elysia](https://elysiajs.com/) with the following features:

- **Zod validation** to support coercing query and path params into `number`s. Since I started the project, Elysia added this as well. Also, TypeBox was so hard to use...
- **Simplify the hook system** to avoid complexity around scope casting, lazy loading, and deduplication, things I didn't care about.
- **OpenAPI first** - document an endpoint _before_ the handler function. Seems like a small thing, but I've found it's a huge DX win.
- **Faster** - Elysia was very slow. Since I started Zeta, Elysia made some massive improvements, but Zeta is comparable in speed: slightly faster in some cases, slightly slower in other.
- **Minimal dependencies** - I've really grown to hate packages with lots of dependencies. Zeta has 3 dependencies and an install size of 203KB (including it's client APIs), vs Elysia's 17 and 4.8MB (including it's client APIs).
- **References in OpenAPI spec** to reduce deduplication in the generated spec.

Additionally, I wanted to build my first complex type-system. How the `App` type changes as you chain route definitions together or add plugins was a really fun challenge.

After finishing it, it seemed like Elysia's type-system was straining my local language server, and type checks were slow. I think Zeta's is faster and lighter-weight, though I have no benchmarks for this.

## Current Status

As elluded to, Elysia has made some good improvements:

1. Performance
2. Standard Schema support (Zod)
3. Coerce path/query parameters automatically

But I still think Zeta's other improvements make it worth using over Elysia. That said, you should try Elysia first to see if it fits your needs, it's gonna be more well supported than Zeta since I made it for myself. But feel free to use Zeta in your projects if you'd like.
