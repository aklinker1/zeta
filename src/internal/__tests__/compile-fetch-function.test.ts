import { describe, it, expect } from "bun:test";
import { compileFetchFunction } from "../compile-fetch-function";

process.env.NODE_ENV = "production";

const origin = "http://localhost";
const getRoute = () => undefined;

describe("compileFetchFunction", () => {
  describe("when there are no hooks", () => {
    it("should be a simple function", () => {
      const actual = compileFetchFunction({
        origin,
        getRoute,
        hooks: {},
      });

      expect(actual.toString()).toMatchInlineSnapshot(`
        "(request) => {
          const path = utils.getRawPathname(request);
          const ctx = new utils.Context(request, path, utils.origin);

          try {
            const matchedRoute = utils.getRoute(request.method, path);
            if (matchedRoute == null) {
              throw new utils.NotFoundHttpError(undefined, {
                method: request.method,
                path,
              });
            } else {
              ctx.matchedRoute = matchedRoute;
            }

            ctx.response = matchedRoute.data.compiledHandler(request, ctx);
            if (typeof ctx.response.then !== utils.FUNCTION) return ctx.response;

            return ctx.response.catch(error => {
              const status =
                error instanceof utils.HttpError
                  ? error.status
                  : utils.HttpStatus.InternalServerError;
              return (ctx.response = Response.json(utils.serializeErrorResponse(error), { status }));
            });
          } catch (error) {
            const status =
              error instanceof utils.HttpError
                ? error.status
                : utils.HttpStatus.InternalServerError;
            return (ctx.response = Response.json(utils.serializeErrorResponse(error), { status }));
          } 
        }"
      `);
    });
  });

  describe("when onGlobalRequest hooks are present", () => {
    it("should call the hooks", () => {
      const actual = compileFetchFunction({
        origin,
        getRoute,
        hooks: {
          onGlobalRequest: [
            { id: "", applyTo: "global", callback: () => void 0 },
          ],
        },
      });

      expect(actual.toString()).toMatchInlineSnapshot(`
        "(request) => {
          const path = utils.getRawPathname(request);
          const ctx = new utils.Context(request, path, utils.origin);

          try {
            const onGlobalRequestRes0 = utils.hooks.onGlobalRequest[0].callback(ctx);
            if (onGlobalRequestRes0)
              if (typeof onGlobalRequestRes0.body?.bytes === utils.FUNCTION)
                return onGlobalRequestRes0;
              else
                for (const key of Object.keys(onGlobalRequestRes0))
                  ctx[key] = onGlobalRequestRes0[key];

            const matchedRoute = utils.getRoute(request.method, path);
            if (matchedRoute == null) {
              throw new utils.NotFoundHttpError(undefined, {
                method: request.method,
                path,
              });
            } else {
              ctx.matchedRoute = matchedRoute;
            }

            ctx.response = matchedRoute.data.compiledHandler(request, ctx);
            if (typeof ctx.response.then !== utils.FUNCTION) return ctx.response;

            return ctx.response.catch(error => {
              const status =
                error instanceof utils.HttpError
                  ? error.status
                  : utils.HttpStatus.InternalServerError;
              return (ctx.response = Response.json(utils.serializeErrorResponse(error), { status }));
            });
          } catch (error) {
            const status =
              error instanceof utils.HttpError
                ? error.status
                : utils.HttpStatus.InternalServerError;
            return (ctx.response = Response.json(utils.serializeErrorResponse(error), { status }));
          } 
        }"
      `);
    });
  });

  describe("when onGlobalAfterResponse hooks are present", () => {
    it("should include try/finally and promise.finally", () => {
      const actual = compileFetchFunction({
        origin,
        getRoute,
        hooks: {
          onGlobalAfterResponse: [
            { id: "", applyTo: "global", callback: () => void 0 },
          ],
        },
      });

      expect(actual.toString()).toMatchInlineSnapshot(`
        "(request) => {
          const path = utils.getRawPathname(request);
          const ctx = new utils.Context(request, path, utils.origin);

          try {
            const matchedRoute = utils.getRoute(request.method, path);
            if (matchedRoute == null) {
              throw new utils.NotFoundHttpError(undefined, {
                method: request.method,
                path,
              });
            } else {
              ctx.matchedRoute = matchedRoute;
            }

            ctx.response = matchedRoute.data.compiledHandler(request, ctx);
            if (typeof ctx.response.then !== utils.FUNCTION) return ctx.response;

            return ctx.response.catch(error => {
              const status =
                error instanceof utils.HttpError
                  ? error.status
                  : utils.HttpStatus.InternalServerError;
              return (ctx.response = Response.json(utils.serializeErrorResponse(error), { status }));
            }).finally(() => {
              setTimeout(() => {
                utils.hooks.onGlobalAfterResponse[0].callback(ctx);
              })
            });
          } catch (error) {
            const status =
              error instanceof utils.HttpError
                ? error.status
                : utils.HttpStatus.InternalServerError;
            return (ctx.response = Response.json(utils.serializeErrorResponse(error), { status }));
          } finally {
            setTimeout(() => {
              utils.hooks.onGlobalAfterResponse[0].callback(ctx);
            })
          }

        }"
      `);
    });
  });

  describe("when onGlobalError hooks are present", () => {
    it("should call the hooks", () => {
      const actual = compileFetchFunction({
        origin,
        getRoute,
        hooks: {
          onGlobalError: [
            { id: "", applyTo: "global", callback: () => void 0 },
          ],
        },
      });

      expect(actual.toString()).toMatchInlineSnapshot(`
        "(request) => {
          const path = utils.getRawPathname(request);
          const ctx = new utils.Context(request, path, utils.origin);

          try {
            const matchedRoute = utils.getRoute(request.method, path);
            if (matchedRoute == null) {
              throw new utils.NotFoundHttpError(undefined, {
                method: request.method,
                path,
              });
            } else {
              ctx.matchedRoute = matchedRoute;
            }

            ctx.response = matchedRoute.data.compiledHandler(request, ctx);
            if (typeof ctx.response.then !== utils.FUNCTION) return ctx.response;

            return ctx.response.catch(error => {
              ctx.error = error;
              utils.hooks.onGlobalError[0].callback(ctx);

              const status =
                error instanceof utils.HttpError
                  ? error.status
                  : utils.HttpStatus.InternalServerError;
              return (ctx.response = Response.json(utils.serializeErrorResponse(error), { status }));
            });
          } catch (error) {
            ctx.error = error;
            utils.hooks.onGlobalError[0].callback(ctx);

            const status =
              error instanceof utils.HttpError
                ? error.status
                : utils.HttpStatus.InternalServerError;
            return (ctx.response = Response.json(utils.serializeErrorResponse(error), { status }));
          } 
        }"
      `);
    });
  });
});
