import { callHandler } from "./internal/call-handler";
import { HttpError } from "./errors";
import { Status } from "./status";
import type { App, RouterData, BaseDef, BasePath } from "./types";
import { addRoute, createRouter, findRoute } from "rou3";
import { serializeErrorResponse } from "./internal/utils";
import type { OpenAPIV3_1 } from "openapi-types";

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
          addRoute(router, method, path, data);
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
    decorate: (key, value) => {
      decorators[key] = value;
      return app;
    },

    get: (...args: any[]) => app.method.apply(app, ["GET", ...args] as any),
    post: (...args: any[]) => app.method.apply(app, ["POST", ...args] as any),
    put: (...args: any[]) => app.method.apply(app, ["PUT", ...args] as any),
    delete: (...args: any[]) =>
      app.method.apply(app, ["DELETE", ...args] as any),

    method(method: string, path: BasePath, ...args: any[]) {
      const def: BaseDef = args.length === 2 ? args[0] : undefined;
      const handler = args[1] ?? args[0];
      const route = `${prefix}${path}`;
      addRoutesEntry(method, route, { def, handler, route });
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

export type CreateAppOptionsWithPrefix<TPrefix extends BasePath> =
  CreateAppOptions & {
    prefix: TPrefix;
  };

export type CreateAppOptionsWithoutPrefix = Omit<CreateAppOptions, "prefix">;
