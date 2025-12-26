import { callHandler } from "./internal/call-handler";
import { HttpError } from "./errors";
import { HttpStatus } from "./status";
import type {
  App,
  RouterData,
  RouteDef,
  BasePath,
  ServerSideFetch,
  OnGlobalRequestContext,
  LifeCycleHooks,
  LifeCycleHook,
  DefaultAppData,
  BasePrefix,
  SchemaAdapter,
  Transport,
} from "./types";
import { addRoute, createRouter } from "rou3";
import { compileRouter } from "rou3/compiler";
import {
  callCtxModifierHooks,
  detectTransport,
  getRawPathname,
  serializeErrorResponse,
} from "./internal/utils";
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
  const hooks: App["~zeta"]["hooks"] = {};
  const routes: App["~zeta"]["routes"] = {};

  const addRoutesEntry = (method: string, route: string, data: RouterData) => {
    routes[method] ??= {};
    if (routes[method][route]) {
      console.warn(`Route ${route} already exists`);
    }
    routes[method][route] = data;
  };

  const cloneHooks = (): App["~zeta"]["hooks"] => {
    const cloned: App["~zeta"]["hooks"] = {};
    for (const key of Object.keys(hooks) as Array<keyof LifeCycleHooks>) {
      if (hooks[key]) cloned[key] = [...hooks[key]] as any;
    }
    return cloned;
  };

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
      if (docs.type === "error") {
        console.error("Failed to build OpenAPI docs:", docs.error);
      }

      app.get(jsonRoute, () => {
        if (docs.type === "error") {
          console.error("Failed to build OpenAPI docs:", docs.error);
          throw docs.error;
        }
        return docs.spec;
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

      const getRoute = compileRouter(router);

      return async (request) => {
        let url: URL | undefined;
        const ctx: any = {
          path: getRawPathname(request),
          get url() {
            if (url) return url;
            return (url = new URL(request.url, origin));
          },
          request,
          method: request.method,
          set: {
            status: HttpStatus.Ok,
            headers: {},
          },
        } satisfies OnGlobalRequestContext;

        try {
          const onGlobalRequestResponse = await callCtxModifierHooks(
            ctx,
            hooks.onGlobalRequest,
          );
          if (onGlobalRequestResponse) {
            ctx.response = onGlobalRequestResponse;
            return onGlobalRequestResponse;
          }

          const response = await callHandler(
            ctx,
            getRoute,
            options?.schemaAdapter,
          );
          ctx.response = response;

          return response;
        } catch (err) {
          ctx.error = err;

          if (hooks.onGlobalError) {
            for (const hook of hooks.onGlobalError) {
              const res = hook.callback(ctx);
              if (res instanceof Promise) await res;
            }
          }

          const status =
            err instanceof HttpError
              ? err.status
              : HttpStatus.InternalServerError;
          const res = Response.json(serializeErrorResponse(err), { status });
          ctx.response = res;
          return res;
        } finally {
          // Defer calls to the `onGlobalAfterResponse` hooks until after the response is sent
          if (hooks.onGlobalAfterResponse) {
            setTimeout(async () => {
              try {
                for (const hook of hooks.onGlobalAfterResponse!) {
                  let res = hook.callback(ctx);
                  if (res instanceof Promise) await res;
                }
              } catch (err) {
                ctx.error = err;

                if (hooks.onGlobalError) {
                  for (const hook of hooks.onGlobalError) {
                    const res = hook.callback(ctx);
                    if (res instanceof Promise) await res;
                  }
                }
              }
            }, 0);
          }
        }
      };
    },

    getOpenApiSpec: () => {
      const res = buildOpenApiDocs(options, app);
      if (res.type === "error") throw res.error;

      return res.spec;
    },

    export: () => {
      app["~zeta"].exported = true;
      return app as any;
    },

    listen: (port, cb) => {
      const transport = options?.transport ?? detectTransport();
      transport.listen(port, app.build(), cb);
      return app;
    },

    decorate: (...args: any[]) => {
      const obj: Record<string, any> =
        args.length === 2 ? { [args[0]]: args[1] } : args[0];

      hooks.onTransform ??= [];
      hooks.onTransform.push({
        id: nextHookId(appId),
        applyTo: "local",
        callback: () => obj,
      });

      return app;
    },

    onGlobalRequest(callback: any) {
      hooks.onGlobalRequest ??= [];
      hooks.onGlobalRequest.push({
        id: nextHookId(appId),
        applyTo: "global",
        callback,
      });
      return app;
    },
    onTransform(callback: any) {
      hooks.onTransform ??= [];
      hooks.onTransform.push({
        id: nextHookId(appId),
        applyTo: "local",
        callback,
      });
      return app;
    },
    onBeforeHandle(callback: any) {
      hooks.onBeforeHandle ??= [];
      hooks.onBeforeHandle.push({
        id: nextHookId(appId),
        applyTo: "local",
        callback,
      });
      return app;
    },
    onAfterHandle(callback: any) {
      hooks.onAfterHandle ??= [];
      hooks.onAfterHandle.push({
        id: nextHookId(appId),
        applyTo: "local",
        callback,
      });
      return app;
    },
    onMapResponse(callback: any) {
      hooks.onMapResponse ??= [];
      hooks.onMapResponse.push({
        id: nextHookId(appId),
        applyTo: "local",
        callback,
      });
      return app;
    },
    onGlobalError(callback: any) {
      hooks.onGlobalError ??= [];
      hooks.onGlobalError.push({
        id: nextHookId(appId),
        applyTo: "global",
        callback,
      });
      return app;
    },
    onGlobalAfterResponse(callback: any) {
      hooks.onGlobalAfterResponse ??= [];
      hooks.onGlobalAfterResponse.push({
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
      const def: RouteDef = args.length === 2 ? args[0] : undefined;
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
      for (const name of Object.keys(hooks) as Array<keyof LifeCycleHooks>) {
        if (!childApp["~zeta"].hooks[name]) continue;

        for (const hook of childApp["~zeta"].hooks[name]) {
          if (hook.applyTo === "global" || childApp["~zeta"].exported) {
            if (hooks[name]) {
              hooks[name].push(hook as LifeCycleHook<any>);
            } else {
              hooks[name] = [hook as LifeCycleHook<any>];
            }
          }
        }
        let seen: Record<string, boolean> = Object.create(null);
        hooks[name] = hooks[name]!.filter((hook) => {
          if (seen[hook.id]) return false;
          return (seen[hook.id] = true);
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
   * Tell Zeta how to serve your app over a port. By default, Zeta will detect
   * if you're runtime is Bun or Deno, and use the appropriate transport.
   *
   * If you need to customize the transport, like adding an `idleTimeout` to
   * bun, you can do so by passing options into the transport's factory function.
   *
   * @example
   * ```ts
   * import { createBunTransport } from "@aklinker1/zeta/transports/bun-transport"
   *
   * const app = createApp({
   *   transport: createBunTransport(),
   * });
   * ```
   */
  transport?: Transport;

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

enum Method {
  Get = "GET",
  Post = "POST",
  Put = "PUT",
  Delete = "DELETE",
  Any = "ANY",
}
