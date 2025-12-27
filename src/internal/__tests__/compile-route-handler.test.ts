import { describe, it, expect } from "bun:test";
import { compileRouteHandler } from "../compile-route-handler";

describe("compileRouteHandler", () => {
  describe("when compiling a mounted fetch function", () => {
    it("should return a simple function", () => {
      const actual = compileRouteHandler({
        route: "/",
        method: "GET",
        hooks: {},
        fetch: () => new Response(),
      });

      expect(actual.toString()).toMatchInlineSnapshot(
        `"(request, ctx) => ctx.matchedRoute.data.fetch(request)"`,
      );
    });
  });

  describe("when compiling route handlers", () => {
    it("should return a simple function with context", () => {
      const actual = compileRouteHandler({
        route: "/",
        method: "GET",
        hooks: {},
        handler: () => 0,
      });

      expect(actual.toString()).toMatchInlineSnapshot(
        `
        "async (request, ctx) => {
          // TODO: Add back ability to return responses from hooks to short-circuit the handler

          ctx.response = await ctx.matchedRoute.data.handler(ctx);
          if (typeof ctx.response?.then === utils.FUNCTION) ctx.response = await ctx.response;

          if (ctx.response == null) {
            return new Response(undefined, {
              status: ctx.set.status,
              headers: ctx.set.headers,
            })
          }

          const serialized = utils.smartSerialize(ctx.response);
          ctx.set.headers["Content-Type"] = serialized.contentType; // TODO: responseMeta?.contentType ?? serialized.contentType
          return new Response(serialized.value, {
            status: ctx.set.status,
            headers: ctx.set.headers,
          })
        }"
      `,
      );
    });

    it("should get the request body for non-GET methods", () => {
      const actual = compileRouteHandler({
        route: "/",
        method: "POST",
        hooks: {},
        handler: () => 0,
      });

      expect(actual.toString()).toMatchInlineSnapshot(
        `
        "async (request, ctx) => {
          ctx.body = utils.smartDeserialize(request);
          if (ctx.body) ctx.body = await ctx.body;

          // TODO: Add back ability to return responses from hooks to short-circuit the handler

          ctx.response = await ctx.matchedRoute.data.handler(ctx);
          if (typeof ctx.response?.then === utils.FUNCTION) ctx.response = await ctx.response;

          if (ctx.response == null) {
            return new Response(undefined, {
              status: ctx.set.status,
              headers: ctx.set.headers,
            })
          }

          const serialized = utils.smartSerialize(ctx.response);
          ctx.set.headers["Content-Type"] = serialized.contentType; // TODO: responseMeta?.contentType ?? serialized.contentType
          return new Response(serialized.value, {
            status: ctx.set.status,
            headers: ctx.set.headers,
          })
        }"
      `,
      );
    });

    it("should include onTransform hook calls", () => {
      const actual = compileRouteHandler({
        hooks: {
          onTransform: [{ id: "", applyTo: "local", callback: () => {} }],
        },
        method: "GET",
        route: "/",
        handler: () => 0,
      });

      expect(actual.toString()).toMatchInlineSnapshot(`
        "async (request, ctx) => {
          // TODO: Add back ability to return responses from hooks to short-circuit the handler

          const onTransformRes0 = await ctx.matchedRoute.data.hooks.onTransform[0].callback(ctx);
          if (onTransformRes0)
            if (typeof onTransformRes0.body === utils.FUNCTION)
              return onTransformRes0;
            else
              for (const key of Object.keys(onTransformRes0))
                ctx[key] = onTransformRes0[key];

          ctx.response = await ctx.matchedRoute.data.handler(ctx);
          if (typeof ctx.response?.then === utils.FUNCTION) ctx.response = await ctx.response;

          if (ctx.response == null) {
            return new Response(undefined, {
              status: ctx.set.status,
              headers: ctx.set.headers,
            })
          }

          const serialized = utils.smartSerialize(ctx.response);
          ctx.set.headers["Content-Type"] = serialized.contentType; // TODO: responseMeta?.contentType ?? serialized.contentType
          return new Response(serialized.value, {
            status: ctx.set.status,
            headers: ctx.set.headers,
          })
        }"
      `);
    });

    it("should include onBeforeHandle hook calls", () => {
      const actual = compileRouteHandler({
        hooks: {
          onBeforeHandle: [{ id: "", applyTo: "local", callback: () => {} }],
        },
        method: "GET",
        route: "/",
        handler: () => 0,
      });

      expect(actual.toString()).toMatchInlineSnapshot(`
        "async (request, ctx) => {
          // TODO: Add back ability to return responses from hooks to short-circuit the handler

          const onBeforeHandleRes0 = await ctx.matchedRoute.data.hooks.onBeforeHandle[0].callback(ctx);
          if (onBeforeHandleRes0)
            if (typeof onBeforeHandleRes0.body === utils.FUNCTION)
              return onBeforeHandleRes0;
            else
              for (const key of Object.keys(onBeforeHandleRes0))
                ctx[key] = onBeforeHandleRes0[key];

          ctx.response = await ctx.matchedRoute.data.handler(ctx);
          if (typeof ctx.response?.then === utils.FUNCTION) ctx.response = await ctx.response;

          if (ctx.response == null) {
            return new Response(undefined, {
              status: ctx.set.status,
              headers: ctx.set.headers,
            })
          }

          const serialized = utils.smartSerialize(ctx.response);
          ctx.set.headers["Content-Type"] = serialized.contentType; // TODO: responseMeta?.contentType ?? serialized.contentType
          return new Response(serialized.value, {
            status: ctx.set.status,
            headers: ctx.set.headers,
          })
        }"
      `);
    });

    it("should include onAfterHandle hook calls", () => {
      const actual = compileRouteHandler({
        hooks: {
          onAfterHandle: [{ id: "", applyTo: "local", callback: () => {} }],
        },
        method: "GET",
        route: "/",
        handler: () => 0,
      });

      expect(actual.toString()).toMatchInlineSnapshot(`
        "async (request, ctx) => {
          // TODO: Add back ability to return responses from hooks to short-circuit the handler

          ctx.response = await ctx.matchedRoute.data.handler(ctx);
          if (typeof ctx.response?.then === utils.FUNCTION) ctx.response = await ctx.response;

          const onAfterHandleRes0 = await ctx.matchedRoute.data.hooks.onAfterHandle[0].callback(ctx);
          if (onAfterHandleRes0) ctx.response = onAfterHandleRes0;
          if (typeof onAfterHandleRes0.body === utils.FUNCTION)
            return onAfterHandleRes0;

          if (ctx.response == null) {
            return new Response(undefined, {
              status: ctx.set.status,
              headers: ctx.set.headers,
            })
          }

          const serialized = utils.smartSerialize(ctx.response);
          ctx.set.headers["Content-Type"] = serialized.contentType; // TODO: responseMeta?.contentType ?? serialized.contentType
          return new Response(serialized.value, {
            status: ctx.set.status,
            headers: ctx.set.headers,
          })
        }"
      `);
    });

    it("should include onMapResponse hook calls", () => {
      const actual = compileRouteHandler({
        hooks: {
          onMapResponse: [{ id: "", applyTo: "local", callback: () => {} }],
        },
        method: "GET",
        route: "/",
        handler: () => 0,
      });

      expect(actual.toString()).toMatchInlineSnapshot(`
        "async (request, ctx) => {
          // TODO: Add back ability to return responses from hooks to short-circuit the handler

          ctx.response = await ctx.matchedRoute.data.handler(ctx);
          if (typeof ctx.response?.then === utils.FUNCTION) ctx.response = await ctx.response;

          const onMapResponseRes0 = await ctx.matchedRoute.data.hooks.onMapResponse[0].callback(ctx);
          if (onMapResponseRes0) ctx.response = onMapResponseRes0;
          if (typeof onMapResponseRes0.body === utils.FUNCTION)
            return onMapResponseRes0;

          if (ctx.response == null) {
            return new Response(undefined, {
              status: ctx.set.status,
              headers: ctx.set.headers,
            })
          }

          const serialized = utils.smartSerialize(ctx.response);
          ctx.set.headers["Content-Type"] = serialized.contentType; // TODO: responseMeta?.contentType ?? serialized.contentType
          return new Response(serialized.value, {
            status: ctx.set.status,
            headers: ctx.set.headers,
          })
        }"
      `);
    });
  });
});
