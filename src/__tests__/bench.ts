import { Bench } from "tinybench";
import { createApp } from "../app";
import type { ServerSideFetch } from "../types";
import { Elysia } from "elysia";
import { Hono } from "hono";
import { z } from "zod/v4";
import { getRawQuery } from "../internal/utils";

// Static Response
{
  const buildRequest = () => new Request("http://localhost/");

  const rawFetch = () => new Response("hi");
  const zetaFetch = createApp()
    .get("/", () => "hi")
    .build();
  const elysiaFetch = new Elysia().get("/", () => "hi").fetch;
  const honoFetch = new Hono().get("/", (c) => c.text("hi")).fetch;

  const fetchTest = (fetch: ServerSideFetch) => async () =>
    await fetch(buildRequest());

  console.log("Responses:", {
    raw: await rawFetch().text(),
    zeta: await (await zetaFetch(buildRequest())).text(),
    elysia: await (await elysiaFetch(buildRequest())).text(),
    hono: await (await honoFetch(buildRequest())).text(),
  });

  const bench = new Bench({ name: "Simple static response" });
  bench
    .add("Raw fetch", fetchTest(rawFetch))
    .add("Zeta", fetchTest(zetaFetch))
    .add("Elysia", fetchTest(elysiaFetch))
    .add("Hono", fetchTest(honoFetch));

  await bench.run();

  console.log(bench.name);
  console.table(bench.table());
}

// Validate request body and echo it back
{
  const buildRequest = () =>
    new Request("http://localhost/path?test=query", {
      method: "POST",
      body: JSON.stringify({ test: "body" }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  const schema = z.object({ test: z.string() });
  const responseSchema = z.object({
    body: schema,
    // params: schema,
    // query: schema,
  });

  const rawFetch = async (req: Request) => {
    const body = schema.parse(await req.json());
    const params = schema.parse({ test: req.url.slice(10) });
    const query = schema.parse(getRawQuery(req));
    return Response.json(responseSchema.parse({ body, params, query }));
  };

  const zetaFetch = createApp()
    .post(
      "/:test",
      {
        body: schema,
        // query: schema,
        // params: schema,
        responses: responseSchema,
      },
      ({
        body,
        // params,
        // query
      }) => ({
        body,
        // params,
        // query,
      }),
    )
    .build();

  const elysiaFetch = new Elysia().post(
    "/:test",
    async ({
      body,
      // params,
      // query
    }) => ({
      body,
      // params,
      // query,
    }),
    {
      body: schema,
      // params: schema,
      // query: schema,
      response: responseSchema,
    },
  ).handle;

  const honoFetch = new Hono().post("/:test", async (c) => {
    const body = schema.parse(await c.req.json());
    // const params = schema.parse({ test: c.req.param("test") });
    // const query = schema.parse({ test: c.req.query("test") });
    return c.json(
      responseSchema.parse({
        body,
        // params,
        // query,
      }),
    );
  }).fetch;

  const fetchTest = (fetch: ServerSideFetch) => async () =>
    await fetch(buildRequest());

  console.log("Responses:", {
    raw: await (await rawFetch(buildRequest())).text(),
    zeta: await (await zetaFetch(buildRequest())).text(),
    elysia: await (await elysiaFetch(buildRequest())).text(),
    hono: await (await honoFetch(buildRequest())).text(),
  });

  const bench = new Bench({ name: "Parse and echo all params" });
  bench
    .add("Raw fetch", fetchTest(rawFetch))
    .add("Zeta", fetchTest(zetaFetch))
    .add("Elysia", fetchTest(elysiaFetch))
    .add("Hono", fetchTest(honoFetch));

  await bench.run();

  console.log(bench.name);
  console.table(bench.table());
}

process.exit(0);
