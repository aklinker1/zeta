import { callHandler } from "./internal/call-handler";
import { HttpError } from "./errors";
import { Status } from "./status";
import type {
  App,
  RouterData,
  BaseDef,
  BasePath,
  ServerSideFetch,
} from "./types";
import { addRoute, createRouter, findRoute } from "rou3";
import { serializeErrorResponse } from "./internal/utils";
import type { OpenAPIV3_1 } from "openapi-types";

/**
 * Create a server-side, Zeta application.
 *
 * @example
 * ```ts
 * import { createApp } from "@aklinker1/zeta";
 *
 * const app = createApp({ prefix: "/api" })
 *   .get("/health", () => "OK")
 *   .get("/users", () => ["user1", "user2"])
 * ```
 *
 * Zeta does not provide any utilities for serving the application, use your runtime's built-in server:
 *
 * @example
 * ```ts
 * Bun.serve({ fetch: app.build() });
 * Deno.serve(app.build());
 * ```
 * @param options Configure application behavior.
 */
export function createApp<TPrefix extends BasePath>(
  options: CreateAppOptionsWithPrefix<TPrefix>,
): App<{ base: TPrefix }>;
export function createApp(options?: CreateAppOptionsWithoutPrefix): App;
export function createApp(options?: CreateAppOptions): App {
  const { origin = "http://localhost", prefix = "" } = options ?? {};
  const decorators: Record<string, any> = {};
  const routes: App["~zeta"]["routes"] = {};

  const addRoutesEntry = (method: string, route: string, data: RouterData) => {
    routes[method] ??= {};
    if (routes[method][route]) {
      console.warn(`Route ${route} already exists`);
    }
    routes[method][route] = data;
  };

  const createPluginData = (): RouterData["pluginData"] => ({
    decorators: { ...decorators },
  });

  const app: App = {
    // @ts-expect-error
    [Symbol.toStringTag]: "ZetaApp",

    "~zeta": {
      prefix,
      routes,
    },

    build: () => {
      app.get("/api/openapi", () => "TEST").get("/api/docs", () => "DOCS");
      const router = createRouter<RouterData>();
      for (const [method, methodValue] of Object.entries(routes)) {
        for (const [path, data] of Object.entries(methodValue)) {
          addRoute(
            router,
            method === Method.Any ? undefined : method,
            path,
            data,
          );
        }
      }

      // const getRoute = compileRouter(router);
      const getRoute2 = (method: string, path: string) =>
        findRoute(router, method, path);

      return async (request) => {
        try {
          const url = new URL(request.url, origin);
          return await callHandler(request, url, getRoute2);
        } catch (err) {
          const status =
            err instanceof HttpError ? err.status : Status.InternalServerError;
          return Response.json(serializeErrorResponse(err), { status });
        }
      };
    },

    decorate: (...args: any[]) => {
      if (args.length === 2) {
        const [key, value] = args;
        decorators[key] = value;
      } else {
        Object.assign(decorators, args[0]);
      }
      return app;
    },

    get: (...args: any[]) =>
      app.method.apply(app, [Method.Get, ...args] as any),
    post: (...args: any[]) =>
      app.method.apply(app, [Method.Post, ...args] as any),
    put: (...args: any[]) =>
      app.method.apply(app, [Method.Put, ...args] as any),
    delete: (...args: any[]) =>
      app.method.apply(app, [Method.Delete, ...args] as any),
    any: (...args: any[]) =>
      app.method.apply(app, [Method.Any, ...args] as any),

    method(method: string, path: BasePath, ...args: any[]) {
      const def: BaseDef = args.length === 2 ? args[0] : undefined;
      const handler = args[1] ?? args[0];
      const route = `${prefix}${path}`;
      addRoutesEntry(method, route, {
        def,
        handler,
        route,
        pluginData: createPluginData(),
      });
      return app;
    },

    mount(...args: any[]) {
      let path = "";
      let def = {};
      let fetch: ServerSideFetch;

      if (args.length === 1) {
        fetch = args[0];
      } else if (args.length === 2) {
        path = args[0];
        fetch = args[1];
      } else {
        path = args[0];
        def = args[1];
        fetch = args[2];
      }

      const route = `${prefix}${path}/**`;
      addRoutesEntry(Method.Any, route, {
        def,
        fetch,
        route,
        pluginData: createPluginData(),
      });

      return app;
    },

    use: (subApp) => {
      for (const [method, methodValue] of Object.entries(
        subApp["~zeta"].routes,
      )) {
        for (const [subRoute, routeValue] of Object.entries(methodValue)) {
          const route = `${prefix}${subRoute}`;
          addRoutesEntry(method, route, { ...routeValue, route });
        }
      }
      return app;
    },
  };
  return app;
}

/**
 * Configure how the app is created.
 */
export type CreateAppOptions = {
  /**
   * The origin to use when constructing URLs.
   * @default "http://localhost"
   */
  origin?: string;
  /**
   * Add a prefix to the beginning of all routes in the app.
   */
  prefix?: BasePath;

  /** Configure how your application's OpenAPI docs are generated. */
  openApi?: OpenAPIV3_1.Document;
};

/** @see {@link CreateAppOptions} */
export type CreateAppOptionsWithPrefix<TPrefix extends BasePath> =
  CreateAppOptions & {
    prefix: TPrefix;
  };

/** @see {@link CreateAppOptions} */
export type CreateAppOptionsWithoutPrefix = Omit<CreateAppOptions, "prefix">;

enum Method {
  Get = "GET",
  Post = "POST",
  Put = "PUT",
  Delete = "DELETE",
  Any = "ANY",
}
