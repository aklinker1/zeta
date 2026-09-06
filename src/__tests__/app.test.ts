import { describe, expect, it, mock } from "bun:test";

import { expectTypeOf } from "expect-type";
import type { OpenAPI } from "openapi-types";
import { z } from "zod/v4";

import { zodSchemaAdapter } from "../adapters/zod-schema-adapter";
import { createApp } from "../app";
import { HttpStatus } from "../status";
import { createTestAppClient } from "../testing";
import { bunServerPlugin, createBunTransport } from "../transports/bun-transport";
import type { AnyDef, GetAppData, Transport } from "../types";

// Silence console.error logs
globalThis.console.error = mock();

describe("App", () => {
  describe("fetch", () => {
    describe("response type inference", () => {
      it.each<{
        respondWith: any;
        expectedResponse: any;
        expectedContentType: string | null;
      }>([
        {
          respondWith: { hello: "world" },
          expectedResponse: { hello: "world" },
          expectedContentType: "application/json",
        },
        {
          respondWith: [1, 2, 3],
          expectedResponse: [1, 2, 3],
          expectedContentType: "application/json",
        },
        {
          respondWith: "test",
          expectedResponse: "test",
          expectedContentType: "text/plain",
        },
        {
          respondWith: true,
          expectedResponse: "true",
          expectedContentType: "text/plain",
        },
        {
          respondWith: 10,
          expectedResponse: "10",
          expectedContentType: "text/plain",
        },
        {
          respondWith: null,
          expectedResponse: undefined,
          expectedContentType: null,
        },
        {
          respondWith: undefined,
          expectedResponse: undefined,
          expectedContentType: null,
        },
      ])(
        "should respond with the correct content type and value for %j",
        async ({ respondWith, expectedResponse, expectedContentType }) => {
          const app = createApp().get("/test", { responses: z.any() }, () => respondWith);
          const fetch = app.build();
          const client = createTestAppClient(app);

          const response = await client.fetch("GET", "/test", {});
          const raw = await fetch(new Request("http://localhost/test"));

          expect(response).toEqual(expectedResponse);
          expect(raw.headers.get("content-type")).toBe(expectedContentType);
        },
      );

      it.each<{ name: string; respondWith: () => any; expectedContentType: string | null }>([
        {
          name: "a class instance",
          respondWith: () =>
            new (class Point {
              x = 1;
            })(),
          expectedContentType: "application/json",
        },
        {
          name: "a null-prototype object",
          respondWith: () => Object.assign(Object.create(null), { x: 1 }),
          expectedContentType: "application/json",
        },
        {
          name: "a Blob",
          respondWith: () => new Blob(["a,b"], { type: "text/csv" }),
          expectedContentType: "text/csv",
        },
      ])(
        "should fall back to full serialization for $name",
        async ({ respondWith, expectedContentType }) => {
          const fetch = createApp().get("/test", respondWith).build();

          const response = await fetch(new Request("http://localhost/test"));

          expect(response.headers.get("content-type")).toBe(expectedContentType);
        },
      );

      it("should keep a status set on the context", async () => {
        const fetch = createApp()
          .get("/test", (ctx) => {
            ctx.set.status = HttpStatus.ImATeapot;
            return { teapot: true };
          })
          .build();

        const response = await fetch(new Request("http://localhost/test"));

        expect(response.status).toBe(HttpStatus.ImATeapot);
        expect(response.headers.get("content-type")).toBe("application/json");
        expect(await response.json()).toEqual({ teapot: true });
      });

      it("should keep headers set on the context", async () => {
        const fetch = createApp()
          .get("/test", (ctx) => {
            ctx.set.headers["X-Custom"] = "yes";
            return "body";
          })
          .build();

        const response = await fetch(new Request("http://localhost/test"));

        expect(response.headers.get("x-custom")).toBe("yes");
        expect(response.headers.get("content-type")).toBe("text/plain");
      });

      it("should let the handler override the content type", async () => {
        const fetch = createApp()
          .get("/test", (ctx) => {
            ctx.set.headers["Content-Type"] = "text/csv";
            return "a,b,c";
          })
          .build();

        const response = await fetch(new Request("http://localhost/test"));

        expect(response.headers.get("content-type")).toBe("text/csv");
      });
    });

    describe("Response content type meta", () => {
      describe("Single response routes", () => {
        const app = createApp({ schemaAdapter: zodSchemaAdapter }).get(
          "/",
          {
            responses: z.string().meta({ contentType: "text/csv" }),
          },
          () => "test,1,2,3",
        );
        const fetch = app.build();

        it("should set the content type automatically for single response routes", async () => {
          const request = new Request("http://localhost");

          const response = await fetch(request);

          expect(response.headers.get("content-type")).toBe("text/csv");
        });
      });

      describe("Multiple response routes", () => {
        const app = createApp({ schemaAdapter: zodSchemaAdapter }).get(
          "/",
          {
            query: z.object({
              status: z.coerce
                .number()
                .pipe(z.union([z.literal(HttpStatus.Ok), z.literal(HttpStatus.Accepted)])),
            }),
            responses: {
              [HttpStatus.Ok]: z.string().meta({ contentType: "text/csv" }),
              [HttpStatus.Accepted]: z.string().meta({ contentType: "application/xml" }),
            },
          },
          ({ query, status }) => status(query.status, ""),
        );
        const fetch = app.build();

        it.each([
          [HttpStatus.Ok, "text/csv"],
          [HttpStatus.Accepted, "application/xml"],
        ])(
          "should set the content type automatically based on the status %d",
          async (status, contentType) => {
            const request = new Request(`http://localhost/?status=${status}`);

            const response = await fetch(request);

            expect(response.status).toBe(status);
            expect(response.headers.get("content-type")).toBe(contentType);
          },
        );
      });
    });

    describe("request body inference", () => {
      it.each<{
        input: any;
        expected: any;
      }>([
        {
          input: { a: "a" },
          expected: { a: "a" },
        },
        {
          input: "test",
          expected: "test",
        },
        {
          input: true,
          expected: "true",
        },
        {
          input: 1,
          expected: "1",
        },
      ])("should parse the request body correctly for: %j", async ({ input, expected }) => {
        let actual: any;
        const app = createApp().post(
          "/test",
          { body: z.any() },
          ({ body }) => void (actual = body),
        );
        const client = createTestAppClient(app);

        await client.fetch("POST", "/test", {
          body: input,
        });

        expect(actual).toEqual(expected);
      });
    });

    describe("path parameters parsing", () => {
      it("should coerce path parameters when using z.coerce.number()", async () => {
        let actual: any;
        const app = createApp().get(
          "/test/:id",
          {
            params: z.object({
              id: z.coerce.number(),
            }),
          },
          ({ params }) => void (actual = params),
        );
        const client = createTestAppClient(app);

        await client.fetch("GET", "/test/:id", {
          params: { id: "123" },
        });

        expect(actual).toEqual({ id: 123 });
        expect(typeof actual.id).toBe("number");
      });

      it("should percent-decode path parameters but leave + alone", async () => {
        let actual: any;
        const fetch = createApp()
          .get("/test/:value", (ctx) => void (actual = ctx.params))
          .build();

        await fetch(new Request("http://localhost/test/a%20b"));
        expect(actual).toEqual({ value: "a b" });

        // "+" only means "space" in query strings, not in path segments.
        await fetch(new Request("http://localhost/test/a+b"));
        expect(actual).toEqual({ value: "a+b" });
      });
    });

    describe("query parameters parsing", () => {
      it.each<{
        input: Record<string, string>;
        expected: Record<string, any>;
      }>([
        {
          input: { a: "a" },
          expected: { a: "a" },
        },
      ])("should parse the query parameters correctly for: %j", async ({ input, expected }) => {
        let actual: any;
        const app = createApp().get(
          "/test",
          {
            query: z.object({
              a: z.any().optional(),
              b: z.any().optional(),
            }),
          },
          ({ query }) => void (actual = query),
        );
        const client = createTestAppClient(app);

        await client.fetch("GET", `/test`, {
          query: input,
        });

        expect(actual).toEqual(expected);
      });

      it("should coerce query parameters when using z.coerce.number()", async () => {
        let actual: any;
        const app = createApp().get(
          "/test",
          {
            query: z.object({
              limit: z.coerce.number(),
            }),
          },
          ({ query }) => void (actual = query),
        );
        const client = createTestAppClient(app);

        await client.fetch("GET", "/test", {
          query: { limit: "50" },
        });

        expect(actual).toEqual({ limit: 50 });
      });

      it("should decode query parameters correctly", async () => {
        let actual: any;
        const app = createApp().get(
          "/test",
          {
            query: z.object({
              text: z.string(),
            }),
          },
          ({ query }) => void (actual = query),
        );
        const client = createTestAppClient(app);

        await client.fetch("GET", "/test", {
          query: { text: "hello world" },
        });

        expect(actual).toEqual({ text: "hello world" });
      });

      it.each<{ search: string; expected: Record<string, string> }>([
        { search: "?a=1&b=2", expected: { a: "1", b: "2" } },
        { search: "?a=hello%20world", expected: { a: "hello world" } },
        { search: "?a=hello+world", expected: { a: "hello world" } },
        { search: "?a=", expected: { a: "" } },
        // Keys without a value are skipped
        { search: "?a", expected: {} },
        // A trailing separator shouldn't leak into the last value
        { search: "?a=1&", expected: { a: "1" } },
        // Only the first "=" separates the key from the value
        { search: "?a=b=c", expected: { a: "b=c" } },
        // Last value wins for repeated keys
        { search: "?a=1&a=2", expected: { a: "2" } },
        { search: "", expected: {} },
      ])("should parse the raw query string $search", async ({ search, expected }) => {
        let actual: any;
        const fetch = createApp()
          .get("/test", (ctx) => void (actual = ctx.query))
          .build();

        await fetch(new Request(`http://localhost/test${search}`));

        expect(actual).toEqual(expected);
      });
    });

    describe("any", () => {
      it("should respond to any method used", async () => {
        const expected = "success";
        const app = createApp().any("/test", () => expected);
        const client = createTestAppClient(app);

        const getActual = await client.fetch("GET", "/test", {});
        const postActual = await client.fetch("POST", "/test", {});

        expect(getActual).toEqual(expected);
        expect(postActual).toEqual(expected);
      });
    });
  });

  describe("use", () => {
    it("should nest child apps inside other apps", async () => {
      const expectedUsers: any[] = [];
      const expectedHealth = "ok";
      const expectedHtml = "Some html...";
      const usersApp = createApp({ prefix: "/users" }).get("/", () => expectedUsers);
      const apiApp = createApp({ prefix: "/api" })
        .use(usersApp)
        .get("/health", () => expectedHealth);
      const app = createApp()
        .use(apiApp)
        .get("/", () => expectedHtml);

      const usersClient = createTestAppClient(usersApp);
      const apiClient = createTestAppClient(apiApp);
      const client = createTestAppClient(app);

      const usersResArray = [
        await usersClient.fetch("GET", "/users", {}),
        await apiClient.fetch("GET", "/api/users", {}),
        await client.fetch("GET", "/api/users", {}),
      ];
      for (const usersRes of usersResArray) {
        expect(usersRes).toEqual(expectedUsers);
      }

      const healthResArray = [
        await apiClient.fetch("GET", "/api/health", {}),
        await client.fetch("GET", "/api/health", {}),
      ];
      for (const healthRes of healthResArray) {
        expect(healthRes).toBe(expectedHealth);
      }

      const htmlRes = await client.fetch("GET", "/", {});
      expect(htmlRes).toBe(expectedHtml);
    });

    it("should deduplicate global hooks when the same one is applied multiple times", async () => {
      const onGlobalRequest = mock(() => {});
      const plugin = createApp().onGlobalRequest(onGlobalRequest);
      const app = createApp()
        .use(plugin)
        .use(plugin)
        .get("/", () => {});
      const client = createTestAppClient(app);

      await client.fetch("GET", "/", {});

      expect(onGlobalRequest).toHaveBeenCalledTimes(1);
    });
  });

  describe("mount", () => {
    it("should fallback to the mounted fetch function", async () => {
      const expected = "mounted response";
      const app = createApp()
        .get("/not-mounted", () => "not" + expected)
        .mount(
          () =>
            new Response(expected, {
              headers: { "Content-Type": "text/plain" },
            }),
        );
      const client = createTestAppClient(app);

      const actual = await client.fetch("GET", "/**", {});

      expect(actual).toEqual(expected);
    });

    it("should fallback to the mounted fetch function at a path", async () => {
      const expected = "mounted response";
      const app = createApp()
        .get("/not-mounted", () => `not-${expected}`)
        .mount(
          "/mounted",
          () =>
            new Response(expected, {
              headers: { "Content-Type": "text/plain" },
            }),
        );
      const appClient = createTestAppClient(app);

      const actual = await appClient.fetch("GET", "/mounted/**", {});

      expect(actual).toEqual(expected);
    });
  });

  describe("life cycle hooks", () => {
    it.each(["onTransform", "onBeforeHandle", "onAfterHandle", "onMapResponse"] as const)(
      "should ignore a %s hook that returns nothing",
      async (hook) => {
        const fetch = createApp()
          [hook](() => {})
          .get("/", () => "handled")
          .build();

        const response = await fetch(new Request("http://localhost/"));

        expect(response.status).toBe(HttpStatus.Ok);
        expect(await response.text()).toBe("handled");
      },
    );

    it.each(["onTransform", "onBeforeHandle"] as const)(
      "should short circuit when a %s hook returns a Response",
      async (hook) => {
        const handler = mock(() => "handled");
        const fetch = createApp()
          [hook](() => new Response("short circuited"))
          .get("/", handler)
          .build();

        const response = await fetch(new Request("http://localhost/"));

        expect(await response.text()).toBe("short circuited");
        expect(handler).not.toHaveBeenCalled();
      },
    );

    // https://github.com/aklinker1/zeta/issues/15
    it.each(["onTransform", "onBeforeHandle"] as const)(
      "should short circuit when a %s hook returns a Response with an empty body",
      async (hook) => {
        const handler = mock(() => "handled");
        const fetch = createApp()
          [hook](() => new Response(undefined, { status: HttpStatus.NoContent }))
          .get("/", handler)
          .build();

        const response = await fetch(new Request("http://localhost/"));

        expect(response.status).toBe(HttpStatus.NoContent);
        expect(await response.text()).toBe("");
        expect(handler).not.toHaveBeenCalled();
      },
    );

    // https://github.com/aklinker1/zeta/issues/15
    it("should short circuit when an onGlobalRequest hook returns a Response with an empty body", async () => {
      const handler = mock(() => "handled");
      const fetch = createApp()
        .onGlobalRequest(() => new Response(undefined, { status: HttpStatus.NoContent }))
        .get("/", handler)
        .build();

      const response = await fetch(new Request("http://localhost/"));

      expect(response.status).toBe(HttpStatus.NoContent);
      expect(await response.text()).toBe("");
      expect(handler).not.toHaveBeenCalled();
    });

    // https://github.com/aklinker1/zeta/issues/15
    it.each(["onAfterHandle", "onMapResponse"] as const)(
      "should replace the response with one with an empty body when a %s hook returns one",
      async (hook) => {
        const fetch = createApp()
          [hook](() => new Response(undefined, { status: HttpStatus.NoContent }))
          .get("/", () => "handled")
          .build();

        const response = await fetch(new Request("http://localhost/"));

        expect(response.status).toBe(HttpStatus.NoContent);
        expect(await response.text()).toBe("");
      },
    );

    it.each(["onAfterHandle", "onMapResponse"] as const)(
      "should replace the response when a %s hook returns one",
      async (hook) => {
        const fetch = createApp()
          [hook](() => new Response("replaced"))
          .get("/", () => "handled")
          .build();

        const response = await fetch(new Request("http://localhost/"));

        expect(await response.text()).toBe("replaced");
      },
    );

    it("should await async hooks", async () => {
      const calls: string[] = [];
      const fetch = createApp()
        .onTransform(async () => void calls.push("transform"))
        .onBeforeHandle(async () => void calls.push("beforeHandle"))
        .onAfterHandle(async () => void calls.push("afterHandle"))
        .get("/", async () => {
          calls.push("handler");
          return "handled";
        })
        .build();

      const response = await fetch(new Request("http://localhost/"));

      expect(await response.text()).toBe("handled");
      expect(calls).toEqual(["transform", "beforeHandle", "handler", "afterHandle"]);
    });
  });

  describe("decorate", () => {
    it("should include the decorated value in the request handlers", async () => {
      const expected = "decorated value";
      const key = "decorated";

      let actual: unknown;
      const app = createApp()
        .decorate(key, expected)
        .get("/", (ctx) => void (actual = ctx));
      const client = createTestAppClient(app);
      await client.fetch("GET", "/", {});

      expect(actual).toMatchObject({
        [key]: expected,
      });
    });

    it("should include all the decorated values in the request handlers", async () => {
      const key1 = "a";
      const value1 = "A";
      const key2 = "b";
      const value2 = "B";

      let actual: unknown;
      const app = createApp()
        .decorate({
          [key1]: value1,
          [key2]: value2,
        })
        .get("/", (ctx) => void (actual = ctx));
      const client = createTestAppClient(app);
      await client.fetch("GET", "/", {});

      expect(actual).toMatchObject({
        [key1]: value1,
        [key2]: value2,
      });
    });

    it("should include the decorated value in the request handlers", async () => {
      const expected = "decorated value";
      const key = "decorated";

      let actual: unknown;
      const app = createApp()
        .decorate(key, expected)
        .get("/", (ctx) => void (actual = ctx));
      const client = createTestAppClient(app);
      await client.fetch("GET", "/", {});

      expect(actual).toMatchObject({
        [key]: expected,
      });
    });

    it("should include all the decorated values in the request handlers", async () => {
      const key1 = "a";
      const value1 = "A";
      const key2 = "b";
      const value2 = "B";

      let actual: unknown;
      const app = createApp()
        .decorate({
          [key1]: value1,
          [key2]: value2,
        })
        .get("/", (ctx) => void (actual = ctx));
      const client = createTestAppClient(app);
      await client.fetch("GET", "/", {});

      expect(actual).toMatchObject({
        [key1]: value1,
        [key2]: value2,
      });
    });

    it("should not include decorated values to parent app by default", async () => {
      const child = createApp().decorate("a", "A");

      let actual: unknown;
      const app = createApp({ prefix: "/app" })
        .use(child)
        .get("/", (ctx) => {
          expectTypeOf<typeof ctx>().not.toHaveProperty("a");
          actual = ctx;
        });
      const client = createTestAppClient(app);
      await client.fetch("GET", "/app", {});

      expectTypeOf<GetAppData<typeof app>>().toEqualTypeOf<{
        ctx: {};
        exported: false;
        prefix: "/app";
        routes: {
          GET: {
            "/": AnyDef;
          };
        };
        transport: Transport;
      }>();
      expect(actual).not.toMatchObject({ a: "A" });
    });

    it("should include decorated values to parent app when child app is exported", async () => {
      const child = createApp().decorate("a", "A").export();

      let actual: unknown;
      const app = createApp({ prefix: "/app" })
        .use(child)
        .get("/", (ctx) => void (actual = ctx));
      const client = createTestAppClient(app);
      await client.fetch("GET", "/app", {});

      expectTypeOf<GetAppData<typeof app>>().toEqualTypeOf<{
        ctx: { a: string };
        exported: false;
        prefix: "/app";
        routes: {
          GET: {
            "/": AnyDef;
          };
        };
        transport: Transport;
      }>();
      expect(actual).toMatchObject({ a: "A" });
    });
  });

  describe("app-level OpenAPI options", () => {
    describe("tags", () => {
      it("should apply app-level tags to all routes", () => {
        const app = createApp({
          schemaAdapter: zodSchemaAdapter,
          tags: ["Users"],
        })
          .get("/", { responses: z.string() }, () => "")
          .post("/", { responses: z.string() }, () => "");

        const spec = app.getOpenApiSpec() as OpenAPI.Document;

        expect((spec.paths!["/"] as any).get.tags).toEqual(["Users"]);
        expect((spec.paths!["/"] as any).post.tags).toEqual(["Users"]);
      });

      it("should allow route-level tags to override app-level tags", () => {
        const app = createApp({
          schemaAdapter: zodSchemaAdapter,
          tags: ["Users"],
        }).get("/", { tags: ["Admin"], responses: z.string() }, () => "");

        const spec = app.getOpenApiSpec() as OpenAPI.Document;

        expect((spec.paths!["/"] as any).get.tags).toEqual(["Admin"]);
      });

      it("should preserve app-level tags when nested via use()", () => {
        const usersApp = createApp({
          prefix: "/users",
          schemaAdapter: zodSchemaAdapter,
          tags: ["Users"],
        }).get("/", { responses: z.string() }, () => "");

        const app = createApp({ schemaAdapter: zodSchemaAdapter }).use(usersApp);

        const spec = app.getOpenApiSpec() as OpenAPI.Document;

        expect((spec.paths!["/users"] as any).get.tags).toEqual(["Users"]);
      });
    });

    describe("security", () => {
      it("should apply app-level security to all routes", () => {
        const app = createApp({
          schemaAdapter: zodSchemaAdapter,
          security: [{ bearerAuth: [] }],
        })
          .get("/", { responses: z.string() }, () => "")
          .post("/", { responses: z.string() }, () => "");

        const spec = app.getOpenApiSpec() as OpenAPI.Document;

        expect((spec.paths!["/"] as any).get.security).toEqual([{ bearerAuth: [] }]);
        expect((spec.paths!["/"] as any).post.security).toEqual([{ bearerAuth: [] }]);
      });

      it("should allow route-level security to override app-level security", () => {
        const app = createApp({
          schemaAdapter: zodSchemaAdapter,
          security: [{ bearerAuth: [] }],
        }).get("/admin", { security: [{ adminKey: [] }], responses: z.string() }, () => "");

        const spec = app.getOpenApiSpec() as OpenAPI.Document;

        expect((spec.paths!["/admin"] as any).get.security).toEqual([{ adminKey: [] }]);
      });

      it("should preserve app-level security when nested via use()", () => {
        const authApp = createApp({
          prefix: "/auth",
          schemaAdapter: zodSchemaAdapter,
          security: [{ bearerAuth: [] }],
        }).get("/profile", { responses: z.string() }, () => "");

        const app = createApp({ schemaAdapter: zodSchemaAdapter }).use(authApp);

        const spec = app.getOpenApiSpec() as OpenAPI.Document;

        expect((spec.paths!["/auth/profile"] as any).get.security).toEqual([{ bearerAuth: [] }]);
      });
    });

    describe("tags and security combined", () => {
      it("should apply both tags and security to routes", () => {
        const app = createApp({
          schemaAdapter: zodSchemaAdapter,
          tags: ["Auth"],
          security: [{ bearerAuth: [] }],
        }).get("/profile", { responses: z.string() }, () => "");

        const spec = app.getOpenApiSpec() as OpenAPI.Document;

        expect((spec.paths!["/profile"] as any).get.tags).toEqual(["Auth"]);
        expect((spec.paths!["/profile"] as any).get.security).toEqual([{ bearerAuth: [] }]);
      });
    });
  });

  describe("transports", () => {
    it("should include transport decorations", async () => {
      const expected = Symbol("server") as any;

      let actual: Bun.Server;
      const app = createApp({
        schemaAdapter: zodSchemaAdapter,
        transport: createBunTransport(),
      })
        .use(bunServerPlugin)
        .get("/", ({ server }) => {
          actual = server;
        });
      await app.build()(new Request("http://localhost:3000"), expected);

      expect(actual!).toBe(expected);
    });
  });
});
