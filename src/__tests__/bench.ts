import { Bench } from "tinybench";
import { createApp } from "../app";
import type { ServerSideFetch } from "../types";
import { Elysia } from "elysia";
import { Hono } from "hono";

{
  const rawFetch = () => new Response("hi");
  const zetaFetch = createApp()
    .get("/", () => "hi")
    .build();
  const elysiaFetch = new Elysia().get("/", () => "hi").fetch;
  const honoFetch = new Hono().get("/", (c) => c.text("hi")).fetch;

  const request = new Request("http://localhost/");
  const fetchTest = (fetch: ServerSideFetch) => async () =>
    await fetch(request);

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
