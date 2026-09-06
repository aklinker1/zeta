import { MarkdownReport } from "@aklinker1/tinybench-report";
import { Elysia } from "elysia";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { Bench } from "tinybench";
import { z } from "zod/v4";

/**
 * Run some targeted benchmarks aiming to compare the internal handlers of
 * different frameworks.
 *
 * Usage:
 *
 *   bun run benchmarks/overhead.ts
 *   bun run benchmarks/overhead.ts "{{benchmark_name}}"
 */
import { createApp } from "../dist/index.mjs";
import type { ServerSideFetch } from "../dist/types.mjs";
import pkgJson from "../package.json";

process.env.NODE_ENV = "production";

const TestObject = z.object({ test: z.string() });
const STATIC_RESPONSE = { test: "response" };

const VANILLA = "vanilla";
const ELYSIA = `elysia v${pkgJson.devDependencies.elysia}`;
const HONO = `hono v${pkgJson.devDependencies.hono}`;
const ZETA = `zeta v${pkgJson.version}`;

const outDir = "benchmarks/results";
const report = new MarkdownReport({
  file: "index.md",
  svg: {
    highlightNames: ZETA,
    labelWidth: 90,
  },
});

{
  const request = new Request("http://localhost/");

  const vanilla: ServerSideFetch = () => new Response("hi");
  const elysia: ServerSideFetch = new Elysia().get("/", "hi").fetch;
  const hono: ServerSideFetch = new Hono().get("/", (c) => c.text("hi")).fetch;
  const zeta: ServerSideFetch = createApp()
    .get("/", () => "hi")
    .build();

  report.add(
    new Bench({ name: "Static Response" })
      .add(VANILLA, () => vanilla(request.clone()))
      .add(ELYSIA, () => elysia(request.clone()))
      .add(HONO, () => hono(request.clone()))
      .add(ZETA, () => zeta(request.clone())),
  );
}

{
  const request = new Request("http://localhost/", {
    method: "POST",
    body: JSON.stringify({ test: "body" }),
    headers: { "Content-Type": "application/json" },
  });

  const vanilla: ServerSideFetch = (req) =>
    req.json().then((body) => Response.json(TestObject.parse(body)));
  const elysia: ServerSideFetch = new Elysia().post("/", (ctx) => ctx.body, {
    body: TestObject,
  }).fetch;
  const hono: ServerSideFetch = new Hono().post("/", (ctx) =>
    ctx.req.json().then((body) => ctx.json(TestObject.parse(body))),
  ).fetch;
  const zeta: ServerSideFetch = createApp()
    // @ts-ignore: expects response schema, but works without it
    .post("/", { body: TestObject }, (ctx) => ctx.body)
    .build();

  report.add(
    new Bench({ name: "Validate and Echo JSON Body" })
      .add(VANILLA, () => vanilla(request.clone()))
      .add(ELYSIA, () => elysia(request.clone()))
      .add(HONO, () => hono(request.clone()))
      .add(ZETA, () => zeta(request.clone())),
  );
}

{
  const request = new Request("http://localhost/?test=query");

  const vanilla: ServerSideFetch = (req) =>
    Response.json(
      Object.fromEntries(new URLSearchParams(req.url.slice(req.url.indexOf("?") + 1)).entries()),
    );
  const elysia: ServerSideFetch = new Elysia().get("/", (ctx) => ctx.query, {
    query: TestObject,
  }).fetch;
  const hono: ServerSideFetch = new Hono().get("/", (ctx) =>
    ctx.json(TestObject.parse(ctx.req.query())),
  ).fetch;
  const zeta: ServerSideFetch = createApp()
    // @ts-ignore: expects response schema, but works without it
    .get("/", { query: TestObject }, (ctx) => ctx.query)
    .build();

  report.add(
    new Bench({ name: "Validate and Echo Query Params" })
      .add(VANILLA, () => vanilla(request.clone()))
      .add(ELYSIA, () => elysia(request.clone()))
      .add(HONO, () => hono(request.clone()))
      .add(ZETA, () => zeta(request.clone())),
  );
}

{
  const request = new Request("http://localhost/path");

  const elysia: ServerSideFetch = new Elysia().get("/:test", (ctx) => ctx.params, {
    params: TestObject,
  }).fetch;
  const hono: ServerSideFetch = new Hono().get("/:test", (ctx) =>
    ctx.json(TestObject.parse(ctx.req.param())),
  ).fetch;
  const zeta: ServerSideFetch = createApp()
    // @ts-ignore: expects response schema, but works without it
    .get("/:test", { params: TestObject }, (ctx) => ctx.params)
    .build();

  report.add(
    new Bench({ name: "Validate and Echo Path Params" })
      .add(ELYSIA, () => elysia(request.clone()))
      .add(HONO, () => hono(request.clone()))
      .add(ZETA, () => zeta(request.clone())),
  );
}

{
  const request = new Request("http://localhost/");

  const vanilla: ServerSideFetch = () => Response.json(TestObject.parse(STATIC_RESPONSE));
  const elysia: ServerSideFetch = new Elysia().get("/", () => STATIC_RESPONSE, {
    response: TestObject,
  }).fetch;
  const hono: ServerSideFetch = new Hono().get("/", (ctx) =>
    ctx.json(TestObject.parse(STATIC_RESPONSE)),
  ).fetch;
  const zeta: ServerSideFetch = createApp()
    // @ts-ignore: expects response schema, but works without it
    .get("/", { responses: TestObject }, () => STATIC_RESPONSE)
    .build();

  report.add(
    new Bench({ name: "Response Validation" })
      .add(VANILLA, () => vanilla(request.clone()))
      .add(ELYSIA, () => elysia(request.clone()))
      .add(HONO, () => hono(request.clone()))
      .add(ZETA, () => zeta(request.clone())),
  );
}

{
  const request = new Request("http://localhost/");

  const elysia: ServerSideFetch = new Elysia()
    .decorate({ fn: () => STATIC_RESPONSE })
    .get("/", (ctx) => ctx.fn()).fetch;
  const hono: ServerSideFetch = new Hono()
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
    .get("/", (ctx) => ctx.json(ctx.var.fn())).fetch;
  const zeta: ServerSideFetch = createApp()
    .decorate({ fn: () => STATIC_RESPONSE })
    .get("/", (ctx) => ctx.fn())
    .build();

  report.add(
    new Bench({ name: "Single hook" })
      .add(ELYSIA, () => elysia(request.clone()))
      .add(HONO, () => hono(request.clone()))
      .add(ZETA, () => zeta(request.clone())),
  );
}

for (const { bench } of report.benches) {
  console.log("---");
  console.log(bench.name);
  await bench.run();
  console.table(bench.table());
}

const files = report.render();
await report.write(outDir, files);
