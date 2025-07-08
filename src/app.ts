import { callHandler } from "./internal/call-handler";
import { HttpError } from "./errors";
import { Status } from "./status";
import type {
  App,
  RouterData,
  BaseDef,
  BasePath,
  ServerSideFetch,
  OnRequestContext,
  LifeCycleHooks,
  LifeCycleHook,
  DefaultAppData,
  BasePrefix,
  SchemaAdapter,
} from "./types";
import { addRoute, createRouter, findRoute } from "rou3";
import { callCtxModifierHooks, serializeErrorResponse } from "./internal/utils";
import type { OpenAPIV3_1 } from "openapi-types";
import { buildOpenApiDocs, buildScalarHtml } from "./open-api";

let appIdInc = 0;
const nextAppId = () => `app-${appIdInc++}`;

let _hookIdInc = 0;
const nextHookId = (appId: string) => `${appId}/hook-${_hookIdInc++}`;

/**
 * Create a server-side, Zeta application.
 *
 * Zeta provides simple support for serving applications using `Bun.serve` and
 * `Deno.serve` by calling `app.listen(3000)`.
 *
 * If you need more customization, you can use the `build` method to create a
 * `fetch` function and serve it however you like.
 *
 * @example
 * ```ts
 * import { createApp } from "@aklinker1/zeta";
 *
 * const app = createApp({ prefix: "/api" })
 *   .get("/health", () => "OK")
 *   .get("/users", () => ["user1", "user2"]);
 *
 * app.listen(3000);
 *
 * // Or serve the app yourself
 * const fetch = app.build();
 * Bun.serve({ fetch, ... });
 * Deno.serve({ fetch, ... });
 * ```
 *
 * @param options Configure application behavior.
 */
export function createApp<TPrefix extends BasePrefix = "">(
  options?: CreateAppOptions<TPrefix>,
): App<{
  ctx: {};
  exported: false;
  prefix: TPrefix;
  routes: {};
}> {
  const appId = nextAppId();

  const { origin = "http://localhost", prefix = "" } = options ?? {};
  const hooks: App["~zeta"]["hooks"] = {
    afterHandle: [],
    afterResponse: [],
    beforeHandle: [],
    mapResponse: [],
    onError: [],
    onRequest: [],
    transform: [],
  };
  const routes: App["~zeta"]["routes"] = {};

  const addRoutesEntry = (method: string, route: string, data: RouterData) => {
    routes[method] ??= {};
    if (routes[method][route]) {
      console.warn(`Route ${route} already exists`);
    }
    routes[method][route] = data;
  };

  const cloneHooks = () => ({
    afterHandle: [...hooks.afterHandle],
    afterResponse: [...hooks.afterResponse],
    beforeHandle: [...hooks.beforeHandle],
    mapResponse: [...hooks.mapResponse],
    onError: [...hooks.onError],
    onRequest: [...hooks.onRequest],
    transform: [...hooks.transform],
  });

  const app: App<DefaultAppData> = {
    // @ts-expect-error
    [Symbol.toStringTag]: "ZetaApp",

    "~zeta": {
      id: appId,
      prefix,
      routes,
      hooks,
    },

    build: () => {
      const jsonRoute = options?.openApiRoute ?? "/openapi.json";
      const scalarRoute = options?.scalarRoute ?? "/scalar";
      const docs = buildOpenApiDocs(options, app);

      app.get(jsonRoute, () => {
        if (docs.type === "error") throw docs.error;
        return docs.docs;
      });
      if (docs.type === "success") {
        const scalarHtml = buildScalarHtml(jsonRoute, options);
        app.get(
          scalarRoute,
          () =>
            new Response(scalarHtml, {
              headers: { "content-type": "text/html;charset=utf-8" },
            }),
        );
      }

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
      const getRoute = (method: string, path: string) =>
        findRoute(router, method, path);

      return async (request) => {
        const url = new URL(request.url, origin);
        const ctx: any = {
          path: url.pathname,
          url,
          request,
          method: request.method,
          set: {
            status: Status.Ok,
            headers: {},
          },
        } satisfies OnRequestContext;

        try {
          const onRequestResponse = await callCtxModifierHooks(
            ctx,
            hooks.onRequest,
          );
          if (onRequestResponse) {
            ctx.response = onRequestResponse;
            return onRequestResponse;
          }

          const response = await callHandler(ctx, getRoute);
          ctx.response = response;

          return response;
        } catch (err) {
          ctx.error = err;

          for (const hook of hooks.onError) {
            let res: any = hook.callback(ctx);
            res = res instanceof Promise ? await res : res;
            if (res instanceof Response) {
              ctx.response = res;
              return res;
            }
          }

          const status =
            err instanceof HttpError ? err.status : Status.InternalServerError;
          const res = Response.json(serializeErrorResponse(err), { status });
          ctx.response = res;
          return res;
        } finally {
          // Defer calls to the `afterResponse` hooks until after the response is sent
          setTimeout(async () => {
            for (const hook of hooks.afterResponse) {
              let res = hook.callback(ctx);
              if (res instanceof Promise) await res;
            }
          });
        }
      };
    },

    export: () => {
      app["~zeta"].exported = true;
      return app as any;
    },

    listen: (port, cb) => {
      if (typeof Bun !== "undefined") {
        Bun.serve({ port, fetch: app.build() });
        if (cb) setTimeout(cb, 0);
      } else if (
        // @ts-expect-error: Deno types not installed.
        typeof Deno !== "undefined"
      ) {
        // @ts-expect-error: Deno types not installed.
        Deno.serve({ port, fetch: app.build() });
        if (cb) setTimeout(cb, 0);
      }
      return app;
    },

    decorate: (...args: any[]) => {
      const obj: Record<string, any> =
        args.length === 2 ? { [args[0]]: args[1] } : args[0];

      hooks.transform.push({
        id: nextHookId(appId),
        applyTo: "local",
        callback: () => obj,
      });

      return app;
    },

    onRequest(callback: any) {
      hooks.onRequest.push({
        id: nextHookId(appId),
        applyTo: "global",
        callback,
      });
      return app;
    },
    transform(callback: any) {
      hooks.transform.push({
        id: nextHookId(appId),
        applyTo: "local",
        callback,
      });
      return app;
    },
    beforeHandle(callback: any) {
      hooks.beforeHandle.push({
        id: nextHookId(appId),
        applyTo: "local",
        callback,
      });
      return app;
    },
    afterHandle(callback: any) {
      hooks.afterHandle.push({
        id: nextHookId(appId),
        applyTo: "local",
        callback,
      });
      return app;
    },
    mapResponse(callback: any) {
      hooks.mapResponse.push({
        id: nextHookId(appId),
        applyTo: "local",
        callback,
      });
      return app;
    },
    onError(callback: any) {
      hooks.onError.push({
        id: nextHookId(appId),
        applyTo: "global",
        callback,
      });
      return app;
    },
    afterResponse(callback: any) {
      hooks.afterResponse.push({
        id: nextHookId(appId),
        applyTo: "global",
        callback,
      });
      return app;
    },

    get: (...args: any[]) =>
      app.method.apply(app, [Method.Get, ...args] as any) as any,
    post: (...args: any[]) =>
      app.method.apply(app, [Method.Post, ...args] as any) as any,
    put: (...args: any[]) =>
      app.method.apply(app, [Method.Put, ...args] as any) as any,
    delete: (...args: any[]) =>
      app.method.apply(app, [Method.Delete, ...args] as any) as any,
    any: (...args: any[]) =>
      app.method.apply(app, [Method.Any, ...args] as any) as any,

    method(method: string, path: BasePath, ...args: any[]) {
      const def: BaseDef = args.length === 2 ? args[0] : undefined;
      const handler = args[1] ?? args[0];
      const route = `${prefix}${path}`;
      addRoutesEntry(method, route, {
        def,
        handler,
        route,
        hooks: cloneHooks(),
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
        hooks: cloneHooks(),
      });

      return app as any;
    },

    use: (childApp) => {
      // Bring in routes
      for (const [method, methodValue] of Object.entries(
        childApp["~zeta"].routes,
      )) {
        for (const [subRoute, routeValue] of Object.entries(methodValue)) {
          const route = `${prefix}${subRoute}`;
          addRoutesEntry(method, route, { ...routeValue, route });
        }
      }

      // Add global hooks to parent app's hooks
      for (const _name of Object.keys(hooks)) {
        const name = _name as keyof LifeCycleHooks;
        for (const hook of childApp["~zeta"].hooks[name]) {
          if (hook.applyTo === "global" || childApp["~zeta"].exported) {
            hooks[name].push(hook as LifeCycleHook<any>);
          }
        }
        let seen = new Set<string>();
        hooks[name] = hooks[name].filter((hook) => {
          if (seen.has(hook.id)) return false;
          seen.add(hook.id);
          return true;
        }) as LifeCycleHook<any>[];
      }

      return app as any;
    },
  };

  return app as any;
}

/**
 * Configure how the app is created.
 */
export type CreateAppOptions<TPrefix extends BasePrefix = ""> = {
  /**
   * The origin to use when constructing URLs.
   * @default "http://localhost"
   */
  origin?: string;

  /**
   * Add a prefix to the beginning of all routes in the app.
   */
  prefix?: TPrefix;

  /**
   * Tell Zeta which library you're using for validation. OpenAPI docs cannot
   * be served without a schema adapter.
   *
   * @example
   * ```ts
   * import { zodSchemaAdapter } from "@aklinker1/zeta/adapters/zod-schema-adapter"
   *
   * const app = createApp({
   *   openApi: {
   *     schemaAdapter: zodSchemaAdapter,
   *   },
   * });
   * ```
   */
  schemaAdapter?: SchemaAdapter;

  /**
   * Where the OpenAPI JSON docs is hosted.
   * @default "/openapi.json"
   */
  openApiRoute?: BasePath;
  /**
   * Where the Scalar UI is hosted.
   * @default "/scalar"
   */
  scalarRoute?: BasePath;

  /** Configure how your application's OpenAPI docs are generated. */
  openApi?: Partial<OpenAPIV3_1.Document> & {};
  /**
   * Configure [Scalar](https://scalar.com/) UI docs.
   * @see https://github.com/scalar/scalar/blob/main/documentation/configuration.md#list-of-all-attributes
   */
  scalar?: any;
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
