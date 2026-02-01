/**
 * Run some targeted benchmarks aiming to compare the internal handlers of
 * different frameworks.
 *
 * Usage:
 *
 *   bun run benchmarks/overhead.ts
 *   bun run benchmarks/overhead.ts "{{benchmark_name}}"
 */
import { createApp } from "@aklinker1/zeta";
import type { ServerSideFetch } from "@aklinker1/zeta/types";
import { Elysia } from "elysia";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { Bench } from "tinybench";
import { z } from "zod/v4";

process.env.NODE_ENV = "production";

const TestObject = z.object({ test: z.string() });
const STATIC_RESPONSE = { test: "response" };

async function runBenchmark(
  name: string,
  options: {
    buildRequest: () => Request;
    fetchFunctions: {
      zeta: ServerSideFetch;
      [name: string]: ServerSideFetch;
    };
  },
): Promise<void> {
  if (
    process.argv[2] &&
    !name.toLowerCase().includes(process.argv[2].toLowerCase())
  ) {
    return;
  }

  console.log(name + ":");

  const responses: Record<string, string> = {};
  for (const [name, fetch] of Object.entries(options.fetchFunctions)) {
    responses[name] = await (await fetch(options.buildRequest())).text();
  }
  console.log("Responses:", responses);

  let request: Request;
  const bench = new Bench({ name });
  for (const [name, fetch] of Object.entries(options.fetchFunctions)) {
    bench.add(name, () => fetch(request!), {
      beforeEach: () => void (request = options.buildRequest()),
    });
  }

  await bench.run();
  console.table(bench.table());
}

await runBenchmark("Static Response", {
  buildRequest: () => new Request("http://localhost/"),
  fetchFunctions: {
    vanilla: () => new Response("hi"),
    elysia: new Elysia().get("/", "hi").fetch,
    hono: new Hono().get("/", (c) => c.text("hi")).fetch,
    zeta: createApp()
      .get("/", () => "hi")
      .build(),
  },
});

await runBenchmark("Validate and Echo JSON Body", {
  buildRequest: () =>
    new Request("http://localhost/", {
      method: "POST",
      body: JSON.stringify({ test: "body" }),
      headers: { "Content-Type": "application/json" },
    }),
  fetchFunctions: {
    vanilla: (req) =>
      req.json().then((body) => Response.json(TestObject.parse(body))),
    elysia: new Elysia().post("/", (ctx) => ctx.body, {
      body: TestObject,
    }).fetch,
    hono: new Hono().post("/", (ctx) =>
      ctx.req.json().then((body) => ctx.json(TestObject.parse(body))),
    ).fetch,
    zeta: createApp()
      // @ts-ignore: expects response schema, but works without it
      .post("/", { body: TestObject }, (ctx) => ctx.body)
      .build(),
  },
});

await runBenchmark("Validate and Echo Query Params", {
  buildRequest: () => new Request("http://localhost/?test=query"),
  fetchFunctions: {
    vanilla: (req) =>
      Response.json(
        Object.fromEntries(
          new URLSearchParams(
            req.url.slice(req.url.indexOf("?") + 1),
          ).entries(),
        ),
      ),
    elysia: new Elysia().get("/", (ctx) => ctx.query, {
      query: TestObject,
    }).fetch,
    hono: new Hono().get("/", (ctx) =>
      ctx.json(TestObject.parse(ctx.req.query())),
    ).fetch,
    zeta: createApp()
      // @ts-ignore: expects response schema, but works without it
      .get("/", { query: TestObject }, (ctx) => ctx.query)
      .build(),
  },
});

await runBenchmark("Validate and Echo Path Params", {
  buildRequest: () => new Request("http://localhost/path"),
  fetchFunctions: {
    elysia: new Elysia().get("/:test", (ctx) => ctx.params, {
      params: TestObject,
    }).fetch,
    hono: new Hono().get("/:test", (ctx) =>
      ctx.json(TestObject.parse(ctx.req.param())),
    ).fetch,
    zeta: createApp()
      // @ts-ignore: expects response schema, but works without it
      .get("/:test", { params: TestObject }, (ctx) => ctx.params)
      .build(),
  },
});

await runBenchmark("Response Validation", {
  buildRequest: () => new Request("http://localhost/"),
  fetchFunctions: {
    vanilla: () => Response.json(TestObject.parse(STATIC_RESPONSE)),
    elysia: new Elysia().get("/", () => STATIC_RESPONSE, {
      response: TestObject,
    }).fetch,
    hono: new Hono().get("/", (ctx) =>
      ctx.json(TestObject.parse(STATIC_RESPONSE)),
    ).fetch,
    zeta: createApp()
      // @ts-ignore: expects response schema, but works without it
      .get("/", { responses: TestObject }, () => STATIC_RESPONSE)
      .build(),
  },
});

await runBenchmark("Single hook", {
  buildRequest: () => new Request("http://localhost/"),
  fetchFunctions: {
    elysia: new Elysia()
      .decorate({ fn: () => STATIC_RESPONSE })
      .get("/", (ctx) => ctx.fn()).fetch,
    hono: new Hono()
      .use(
        createMiddleware<{
          Variables: {
            fn: () => any;
          };
        }>((c, next) => {
          c.set("fn", () => STATIC_RESPONSE);
          return next();
        }),
      )
      .get("/", (ctx) => ctx.json(ctx.var.fn())).fetch,
    zeta: createApp()
      .decorate({ fn: () => STATIC_RESPONSE })
      .get("/", (ctx) => ctx.fn())
      .build(),
  },
});

process.exit(0);
