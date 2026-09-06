import { describe, it, expect } from "bun:test";

import { compileRouteHandlerSource } from "../compile-route-handler";

process.env.NODE_ENV = "production";

describe("compileRouteHandler", () => {
  describe("when compiling a mounted fetch function", () => {
    it("should return a simple function", () => {
      const actual = compileRouteHandlerSource({
        def: undefined,
        schemaAdapter: undefined,
        route: "/",
        method: "GET",
        hooks: {},
        fetch: () => new Response(),
      });

      expect(actual).toMatchInlineSnapshot(
        `
          "return (request, ctx) => ctx.matchedRoute.data.fetch(request)
          //#sourceURL=zeta-jit-generated://get--.js
          "
        `,
      );
    });
  });

  describe("when compiling route handlers", () => {
    it("should return a simple function with context", () => {
      const actual = compileRouteHandlerSource({
        def: undefined,
        schemaAdapter: undefined,
        route: "/",
        method: "GET",
        hooks: {},
        handler: () => 0,
      });

      expect(actual).toMatchInlineSnapshot(
        `
        "function step0(request, ctx) {
          const value0 = ctx.matchedRoute.data.handler(ctx);
          if (value0 != null && typeof value0.then === utils.FUNCTION)
            return value0.then(resolved => step1(request, ctx, resolved));
          return step1(request, ctx, value0);
        }

        function step1(request, ctx, value0) {
          ctx.response = value0;
          if (ctx.response) {
            if (ctx.response[utils.IsStatusResult]) {
              ctx.set.status = ctx.response.status;
              ctx.response = ctx.response.body;
            }
            if (typeof ctx.response?.body?.bytes === utils.FUNCTION) return ctx.response;
          }
          const status = ctx.set.status;
          const headers = ctx.set.rawHeaders;
          if (ctx.response == null)
            return (ctx.response = status === 200 && headers === undefined ? new Response() : new Response(undefined, { status, headers }));
          if (status === 200 && headers === undefined) {
            const type = typeof ctx.response;
            if (type === "object") {
              const ctor = ctx.response.constructor;
              if (ctor === Object || ctor === Array)
                return (ctx.response = new Response(JSON.stringify(ctx.response), utils.JSON_RESPONSE_INIT));
            } else if (type === "string") {
              return (ctx.response = new Response(ctx.response, utils.TEXT_RESPONSE_INIT));
            }
          }
          const serialized = utils.smartSerialize(ctx.response);
          const contentType = serialized.contentType;
          const outHeaders = ctx.set.headers;
          if (contentType && !outHeaders["Content-Type"]) outHeaders["Content-Type"] = contentType;
          return (ctx.response = new Response(serialized.value, { status, headers: outHeaders }));
        }

        return step0;
        //#sourceURL=zeta-jit-generated://get--.js
        "
      `,
      );
    });

    it("should get the request body for non-GET methods", () => {
      const actual = compileRouteHandlerSource({
        def: undefined,
        schemaAdapter: undefined,
        route: "/",
        method: "POST",
        hooks: {},
        handler: () => 0,
      });

      expect(actual).toMatchInlineSnapshot(
        `
        "function step0(request, ctx) {
          const value0 = utils.smartDeserialize(request);
          if (value0 != null && typeof value0.then === utils.FUNCTION)
            return value0.then(resolved => step1(request, ctx, resolved));
          return step1(request, ctx, value0);
        }

        function step1(request, ctx, value0) {
          ctx.body = value0;
          const value1 = ctx.matchedRoute.data.handler(ctx);
          if (value1 != null && typeof value1.then === utils.FUNCTION)
            return value1.then(resolved => step2(request, ctx, resolved));
          return step2(request, ctx, value1);
        }

        function step2(request, ctx, value1) {
          ctx.response = value1;
          if (ctx.response) {
            if (ctx.response[utils.IsStatusResult]) {
              ctx.set.status = ctx.response.status;
              ctx.response = ctx.response.body;
            }
            if (typeof ctx.response?.body?.bytes === utils.FUNCTION) return ctx.response;
          }
          const status = ctx.set.status;
          const headers = ctx.set.rawHeaders;
          if (ctx.response == null)
            return (ctx.response = status === 200 && headers === undefined ? new Response() : new Response(undefined, { status, headers }));
          if (status === 200 && headers === undefined) {
            const type = typeof ctx.response;
            if (type === "object") {
              const ctor = ctx.response.constructor;
              if (ctor === Object || ctor === Array)
                return (ctx.response = new Response(JSON.stringify(ctx.response), utils.JSON_RESPONSE_INIT));
            } else if (type === "string") {
              return (ctx.response = new Response(ctx.response, utils.TEXT_RESPONSE_INIT));
            }
          }
          const serialized = utils.smartSerialize(ctx.response);
          const contentType = serialized.contentType;
          const outHeaders = ctx.set.headers;
          if (contentType && !outHeaders["Content-Type"]) outHeaders["Content-Type"] = contentType;
          return (ctx.response = new Response(serialized.value, { status, headers: outHeaders }));
        }

        return step0;
        //#sourceURL=zeta-jit-generated://post--.js
        "
      `,
      );
    });

    it("should include onTransform hook calls", () => {
      const actual = compileRouteHandlerSource({
        def: undefined,
        schemaAdapter: undefined,
        hooks: {
          onTransform: [{ id: "", applyTo: "local", callback: () => {} }],
        },
        method: "GET",
        route: "/",
        handler: () => 0,
      });

      expect(actual).toMatchInlineSnapshot(`
        "function step0(request, ctx) {
          const value0 = ctx.matchedRoute.data.hooks.onTransform[0].callback(ctx);
          if (value0 != null && typeof value0.then === utils.FUNCTION)
            return value0.then(resolved => step1(request, ctx, resolved));
          return step1(request, ctx, value0);
        }

        function step1(request, ctx, value0) {
          if (value0) {
            if (typeof value0.body?.bytes === utils.FUNCTION) return value0;
            for (const key of Object.keys(value0)) ctx[key] = value0[key];
          }
          const value1 = ctx.matchedRoute.data.handler(ctx);
          if (value1 != null && typeof value1.then === utils.FUNCTION)
            return value1.then(resolved => step2(request, ctx, resolved));
          return step2(request, ctx, value1);
        }

        function step2(request, ctx, value1) {
          ctx.response = value1;
          if (ctx.response) {
            if (ctx.response[utils.IsStatusResult]) {
              ctx.set.status = ctx.response.status;
              ctx.response = ctx.response.body;
            }
            if (typeof ctx.response?.body?.bytes === utils.FUNCTION) return ctx.response;
          }
          const status = ctx.set.status;
          const headers = ctx.set.rawHeaders;
          if (ctx.response == null)
            return (ctx.response = status === 200 && headers === undefined ? new Response() : new Response(undefined, { status, headers }));
          if (status === 200 && headers === undefined) {
            const type = typeof ctx.response;
            if (type === "object") {
              const ctor = ctx.response.constructor;
              if (ctor === Object || ctor === Array)
                return (ctx.response = new Response(JSON.stringify(ctx.response), utils.JSON_RESPONSE_INIT));
            } else if (type === "string") {
              return (ctx.response = new Response(ctx.response, utils.TEXT_RESPONSE_INIT));
            }
          }
          const serialized = utils.smartSerialize(ctx.response);
          const contentType = serialized.contentType;
          const outHeaders = ctx.set.headers;
          if (contentType && !outHeaders["Content-Type"]) outHeaders["Content-Type"] = contentType;
          return (ctx.response = new Response(serialized.value, { status, headers: outHeaders }));
        }

        return step0;
        //#sourceURL=zeta-jit-generated://get--.js
        "
      `);
    });

    it("should include onBeforeHandle hook calls", () => {
      const actual = compileRouteHandlerSource({
        def: undefined,
        schemaAdapter: undefined,
        hooks: {
          onBeforeHandle: [{ id: "", applyTo: "local", callback: () => {} }],
        },
        method: "GET",
        route: "/",
        handler: () => 0,
      });

      expect(actual).toMatchInlineSnapshot(`
        "function step0(request, ctx) {
          const value0 = ctx.matchedRoute.data.hooks.onBeforeHandle[0].callback(ctx);
          if (value0 != null && typeof value0.then === utils.FUNCTION)
            return value0.then(resolved => step1(request, ctx, resolved));
          return step1(request, ctx, value0);
        }

        function step1(request, ctx, value0) {
          if (value0) {
            if (typeof value0.body?.bytes === utils.FUNCTION) return value0;
            for (const key of Object.keys(value0)) ctx[key] = value0[key];
          }
          const value1 = ctx.matchedRoute.data.handler(ctx);
          if (value1 != null && typeof value1.then === utils.FUNCTION)
            return value1.then(resolved => step2(request, ctx, resolved));
          return step2(request, ctx, value1);
        }

        function step2(request, ctx, value1) {
          ctx.response = value1;
          if (ctx.response) {
            if (ctx.response[utils.IsStatusResult]) {
              ctx.set.status = ctx.response.status;
              ctx.response = ctx.response.body;
            }
            if (typeof ctx.response?.body?.bytes === utils.FUNCTION) return ctx.response;
          }
          const status = ctx.set.status;
          const headers = ctx.set.rawHeaders;
          if (ctx.response == null)
            return (ctx.response = status === 200 && headers === undefined ? new Response() : new Response(undefined, { status, headers }));
          if (status === 200 && headers === undefined) {
            const type = typeof ctx.response;
            if (type === "object") {
              const ctor = ctx.response.constructor;
              if (ctor === Object || ctor === Array)
                return (ctx.response = new Response(JSON.stringify(ctx.response), utils.JSON_RESPONSE_INIT));
            } else if (type === "string") {
              return (ctx.response = new Response(ctx.response, utils.TEXT_RESPONSE_INIT));
            }
          }
          const serialized = utils.smartSerialize(ctx.response);
          const contentType = serialized.contentType;
          const outHeaders = ctx.set.headers;
          if (contentType && !outHeaders["Content-Type"]) outHeaders["Content-Type"] = contentType;
          return (ctx.response = new Response(serialized.value, { status, headers: outHeaders }));
        }

        return step0;
        //#sourceURL=zeta-jit-generated://get--.js
        "
      `);
    });

    it("should include onAfterHandle hook calls", () => {
      const actual = compileRouteHandlerSource({
        def: undefined,
        schemaAdapter: undefined,
        hooks: {
          onAfterHandle: [{ id: "", applyTo: "local", callback: () => {} }],
        },
        method: "GET",
        route: "/",
        handler: () => 0,
      });

      expect(actual).toMatchInlineSnapshot(`
        "function step0(request, ctx) {
          const value0 = ctx.matchedRoute.data.handler(ctx);
          if (value0 != null && typeof value0.then === utils.FUNCTION)
            return value0.then(resolved => step1(request, ctx, resolved));
          return step1(request, ctx, value0);
        }

        function step1(request, ctx, value0) {
          ctx.response = value0;
          if (ctx.response) {
            if (ctx.response[utils.IsStatusResult]) {
              ctx.set.status = ctx.response.status;
              ctx.response = ctx.response.body;
            }
            if (typeof ctx.response?.body?.bytes === utils.FUNCTION) return ctx.response;
          }
          const value1 = ctx.matchedRoute.data.hooks.onAfterHandle[0].callback(ctx);
          if (value1 != null && typeof value1.then === utils.FUNCTION)
            return value1.then(resolved => step2(request, ctx, resolved));
          return step2(request, ctx, value1);
        }

        function step2(request, ctx, value1) {
          if (value1) {
            ctx.response = value1;
            if (typeof value1.body?.bytes === utils.FUNCTION) return value1;
          }
          const status = ctx.set.status;
          const headers = ctx.set.rawHeaders;
          if (ctx.response == null)
            return (ctx.response = status === 200 && headers === undefined ? new Response() : new Response(undefined, { status, headers }));
          if (status === 200 && headers === undefined) {
            const type = typeof ctx.response;
            if (type === "object") {
              const ctor = ctx.response.constructor;
              if (ctor === Object || ctor === Array)
                return (ctx.response = new Response(JSON.stringify(ctx.response), utils.JSON_RESPONSE_INIT));
            } else if (type === "string") {
              return (ctx.response = new Response(ctx.response, utils.TEXT_RESPONSE_INIT));
            }
          }
          const serialized = utils.smartSerialize(ctx.response);
          const contentType = serialized.contentType;
          const outHeaders = ctx.set.headers;
          if (contentType && !outHeaders["Content-Type"]) outHeaders["Content-Type"] = contentType;
          return (ctx.response = new Response(serialized.value, { status, headers: outHeaders }));
        }

        return step0;
        //#sourceURL=zeta-jit-generated://get--.js
        "
      `);
    });

    it("should include onMapResponse hook calls", () => {
      const actual = compileRouteHandlerSource({
        def: undefined,
        schemaAdapter: undefined,
        hooks: {
          onMapResponse: [{ id: "", applyTo: "local", callback: () => {} }],
        },
        method: "GET",
        route: "/",
        handler: () => 0,
      });

      expect(actual).toMatchInlineSnapshot(`
        "function step0(request, ctx) {
          const value0 = ctx.matchedRoute.data.handler(ctx);
          if (value0 != null && typeof value0.then === utils.FUNCTION)
            return value0.then(resolved => step1(request, ctx, resolved));
          return step1(request, ctx, value0);
        }

        function step1(request, ctx, value0) {
          ctx.response = value0;
          if (ctx.response) {
            if (ctx.response[utils.IsStatusResult]) {
              ctx.set.status = ctx.response.status;
              ctx.response = ctx.response.body;
            }
            if (typeof ctx.response?.body?.bytes === utils.FUNCTION) return ctx.response;
          }
          const value1 = ctx.matchedRoute.data.hooks.onMapResponse[0].callback(ctx);
          if (value1 != null && typeof value1.then === utils.FUNCTION)
            return value1.then(resolved => step2(request, ctx, resolved));
          return step2(request, ctx, value1);
        }

        function step2(request, ctx, value1) {
          if (value1) {
            ctx.response = value1;
            if (typeof value1.body?.bytes === utils.FUNCTION) return value1;
          }
          const status = ctx.set.status;
          const headers = ctx.set.rawHeaders;
          if (ctx.response == null)
            return (ctx.response = status === 200 && headers === undefined ? new Response() : new Response(undefined, { status, headers }));
          if (status === 200 && headers === undefined) {
            const type = typeof ctx.response;
            if (type === "object") {
              const ctor = ctx.response.constructor;
              if (ctor === Object || ctor === Array)
                return (ctx.response = new Response(JSON.stringify(ctx.response), utils.JSON_RESPONSE_INIT));
            } else if (type === "string") {
              return (ctx.response = new Response(ctx.response, utils.TEXT_RESPONSE_INIT));
            }
          }
          const serialized = utils.smartSerialize(ctx.response);
          const contentType = serialized.contentType;
          const outHeaders = ctx.set.headers;
          if (contentType && !outHeaders["Content-Type"]) outHeaders["Content-Type"] = contentType;
          return (ctx.response = new Response(serialized.value, { status, headers: outHeaders }));
        }

        return step0;
        //#sourceURL=zeta-jit-generated://get--.js
        "
      `);
    });
  });
});
