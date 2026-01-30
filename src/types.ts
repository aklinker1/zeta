/**
 * Types used internally by Zeta to build the type system. You probably don't
 * need to use these, and there is no guarantee that they will remain stable
 * between non-major versions.
 *
 * @internal Subject to breaking changes outside of major versions.
 * @module
 */
import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { OpenAPI } from "openapi-types";
import type { IsStatusResult } from "./internal/utils";
import type { HttpStatus } from "./status";

//
// APP
//

/**
 * Represents an App object. TAppData represents additional type information not
 * always stored on the app object itself.
 */
export interface App<TAppData extends AppData = AppData> {
  /**
   * Internal references for implementing routing and calling registered
   * handlers. Subject to breaking changes outside of major versions.
   * @internal
   */
  "~zeta": {
    /**
     * Used for deduplication of hooks.
     */
    id: string;

    /**
     * When true, hooks defined on this app should be added to any app that
     * imports this app.
     */
    exported?: boolean;

    /**
     * Path prefix from `CreateAppOptions.prefix`.
     */
    prefix: string;

    /**
     * List of routes registered with the app.
     */
    routes: { [method: string]: { [path: string]: RouterData } };

    /**
     * Stores arrays of hooks registered on the app.
     */
    hooks: LifeCycleHooks;
  };

  /**
   * Merge and simplify all the app routes into a single fetch function.
   */
  build: () => ServerSideFetch;

  /**
   * Returns your application's OpenAPI spec. You do not need to listen to a
   * port to call this method.
   */
  getOpenApiSpec: () => OpenAPI.Document;

  /**
   * Mark the app as "exported". When an exported app is `use`d by a
   * parent app, the parent app will inherit all of it's hooks and modifiers.
   *
   * Regular, non-exported apps isolate their hooks and modifiers from the
   * parent app (except for the global hooks, `onGlobalRequest`, `onGlobalError`, and
   * `onGlobalAfterResponse`, which are always inherited by the parent app).
   *
   * The basic example is you can't access a decorated value from a parent app
   * unless the child app is exported.
   *
   * @example
   * ```ts
   * const child = createApp()
   *   .decorate("a", "A");
   *
   * const bad = createApp()
   *   .use(child)
   *   .get("/", ({ a }) => {
   *     console.log(a); // => undefined
   *   });
   *
   * const good = createApp()
   *   .use(child.export())
   *   .get("/", ({ a }) => {
   *     console.log(a); // => "A"
   *   });
   * ```
   */
  export: () => App<MergeAppData<TAppData, { exported: true }>>;

  /**
   * Detect the current environment and use `Bun.serve` or `Deno.serve` to serve the app over a port.
   * @param port The port to listen on.
   * @param cb Optional callback to be called when the server is ready.
   */
  listen: (port: number, cb?: () => void) => this;

  /**
   * Add a static value to the handler context.
   */
  decorate<TKey extends string, TValue>(
    key: TKey,
    value: TValue,
  ): App<
    Simplify<
      MergeAppData<TAppData, { ctx: { [key in TKey]: Readonly<TValue> } }>
    >
  >;
  /**
   * Add multiple static values to the handler context.
   */
  decorate<TValues extends Record<string, any>>(
    values: TValues,
  ): App<Simplify<MergeAppData<TAppData, { ctx: TValues }>>>;

  /**
   * Add a callback that is called before the route is matched. If the callback
   * returns a value, it will be merged into the `ctx` object. If the callback
   * returns a `Response`, it will be returned immediately.
   *
   * @param callback The function to call.
   */
  onGlobalRequest(
    callback: (
      ctx: OnGlobalRequestContext<GetAppDataCtx<TAppData>>,
    ) => MaybePromise<void>,
  ): this;
  onGlobalRequest(
    callback: (
      ctx: OnGlobalRequestContext<GetAppDataCtx<TAppData>>,
    ) => MaybePromise<Response>,
  ): this;
  onGlobalRequest<TNewCtx extends Record<string, any>>(
    callback: (
      ctx: OnGlobalRequestContext<GetAppDataCtx<TAppData>>,
    ) => MaybePromise<TNewCtx>,
  ): App<MergeAppData<TAppData, { ctx: TNewCtx }>>;

  /**
   * Add a callback that is called after the route is matched and before the
   * inputs are validated. If the callback returns a value, it will be merged
   * into the `ctx` object. If the callback returns a `Response`, it will be
   * returned immediately.
   *
   * @param callback The function to call.
   */
  onTransform(
    callback: (
      ctx: OnTransformContext<GetAppDataCtx<TAppData>>,
    ) => MaybePromise<void>,
  ): this;
  onTransform(
    callback: (
      ctx: OnTransformContext<GetAppDataCtx<TAppData>>,
    ) => MaybePromise<Response>,
  ): this;
  onTransform<TNewCtx extends Record<string, any>>(
    callback: (
      ctx: OnTransformContext<GetAppDataCtx<TAppData>>,
    ) => MaybePromise<TNewCtx>,
  ): App<MergeAppData<TAppData, { ctx: TNewCtx }>>;

  /**
   * Add a callback that is called after inputs are validated and before the
   * handler is called. If the callback returns a value, it will be merged into
   * the `ctx` object. If the callback returns a `Response`, it will be returned
   * immediately.
   *
   * @param callback The function to call.
   */
  onBeforeHandle(
    callback: (
      ctx: OnBeforeHandleContext<GetAppDataCtx<TAppData>>,
    ) => MaybePromise<void>,
  ): this;
  onBeforeHandle(
    callback: (
      ctx: OnBeforeHandleContext<GetAppDataCtx<TAppData>>,
    ) => MaybePromise<Response>,
  ): this;
  onBeforeHandle<TNewCtx extends Record<string, any>>(
    callback: (
      ctx: OnBeforeHandleContext<GetAppDataCtx<TAppData>>,
    ) => MaybePromise<TNewCtx>,
  ): App<MergeAppData<TAppData, { ctx: TNewCtx }>>;

  /**
   * Add a callback that is called after the handler is called and before the
   * response is validated. If the callback returns a value, it replaces the
   * response with it.
   *
   * @param callback The function to call.
   */
  onAfterHandle(
    callback: (
      ctx: AfterHandleContext<GetAppDataCtx<TAppData>>,
    ) => MaybePromise<unknown | void>,
  ): this;

  /**
   * Add a callback that is called after the response is validated and before it
   * is sent to the client. The callback can return a `Response` if you want to
   * change how the response is built.
   *
   * @param callback The function to call.
   */
  onMapResponse(
    callback: (
      ctx: AfterHandleContext<GetAppDataCtx<TAppData>>,
    ) => MaybePromise<unknown | void>,
  ): this;

  /**
   * Add a callback that is called when an error is thrown. The callback can
   * optionally return a `Response`, which will be used to respond to the
   * client.
   *
   * @param callback The function to call.
   */
  onGlobalError(
    callback: (
      ctx: OnGlobalErrorContext<GetAppDataCtx<TAppData>>,
    ) => MaybePromise<void>,
  ): this;

  /**
   * Add a callback that is called after the response is sent.
   * @param callback The function to call.
   */
  onGlobalAfterResponse(
    callback: (
      ctx: AfterResponseContext<GetAppDataCtx<TAppData>>,
    ) => MaybePromise<void>,
  ): this;

  /**
   * Add an undocumented GET route to the app.
   */
  get<TPath extends BasePath>(
    path: TPath,
    handler: RouteHandler<TAppData, TPath, AnyDef>,
  ): App<
    MergeAppData<TAppData, { routes: { GET: { [path in TPath]: AnyDef } } }>
  >;
  /**
   * Add a documented GET route to the app.
   */
  get<TPath extends BasePath, TRouteDef extends RouteDef>(
    path: TPath,
    def: TRouteDef,
    handler: RouteHandler<TAppData, TPath, TRouteDef>,
  ): App<
    MergeAppData<TAppData, { routes: { GET: { [path in TPath]: TRouteDef } } }>
  >;

  /**
   * Add an undocumented POST route to the app.
   */
  post<TPath extends BasePath>(
    path: TPath,
    handler: RouteHandler<TAppData, TPath, AnyDef>,
  ): App<
    MergeAppData<TAppData, { routes: { POST: { [path in TPath]: AnyDef } } }>
  >;
  /**
   * Add a documented POST route to the app.
   */
  post<TPath extends BasePath, TRouteDef extends RouteDef>(
    path: TPath,
    def: TRouteDef,
    handler: RouteHandler<TAppData, TPath, TRouteDef>,
  ): App<
    MergeAppData<TAppData, { routes: { POST: { [path in TPath]: TRouteDef } } }>
  >;

  /**
   * Add an undocumented PUT route to the app.
   */
  put<TPath extends BasePath>(
    path: TPath,
    handler: RouteHandler<TAppData, TPath, AnyDef>,
  ): App<
    MergeAppData<TAppData, { routes: { PUT: { [path in TPath]: AnyDef } } }>
  >;
  /**
   * Add a documented PUT route to the app.
   */
  put<TPath extends BasePath, TRouteDef extends RouteDef>(
    path: TPath,
    def: TRouteDef,
    handler: RouteHandler<TAppData, TPath, TRouteDef>,
  ): App<
    MergeAppData<TAppData, { routes: { PUT: { [path in TPath]: TRouteDef } } }>
  >;

  /**
   * Add an undocumented DELETE route to the app.
   */
  delete<TPath extends BasePath>(
    path: TPath,
    handler: RouteHandler<TAppData, TPath, AnyDef>,
  ): App<
    MergeAppData<TAppData, { routes: { DELETE: { [path in TPath]: AnyDef } } }>
  >;
  /**
   * Add a documented DELETE route to the app.
   */
  delete<TPath extends BasePath, TRouteDef extends RouteDef>(
    path: TPath,
    def: TRouteDef,
    handler: RouteHandler<TAppData, TPath, TRouteDef>,
  ): App<
    MergeAppData<
      TAppData,
      { routes: { DELETE: { [path in TPath]: TRouteDef } } }
    >
  >;

  /**
   * Add an undocumented route to the app that responds to any method used.
   */
  any<TPath extends BasePath>(
    path: TPath,
    handler: RouteHandler<TAppData, TPath, AnyDef>,
  ): App<
    MergeAppData<TAppData, { routes: { ANY: { [path in TPath]: AnyDef } } }>
  >;

  /**
   * Add an documented route to the app that responds to any method used.
   */
  any<TPath extends BasePath, TRouteDef extends RouteDef>(
    path: TPath,
    def: TRouteDef,
    handler: RouteHandler<TAppData, TPath, AnyDef>,
  ): App<
    MergeAppData<TAppData, { routes: { ANY: { [path in TPath]: TRouteDef } } }>
  >;

  /**
   * Add an undocumented route to the app using a custom method.
   */
  method<TMethod extends string, TPath extends BasePath>(
    method: TMethod,
    path: TPath,
    handler: RouteHandler<TAppData, TPath, AnyDef>,
  ): App<
    MergeAppData<
      TAppData,
      { routes: { [method in TMethod]: { [path in TPath]: AnyDef } } }
    >
  >;
  /**
   * Add a documented route to the app using a custom method.
   */
  method<
    TMethod extends string,
    TPath extends BasePath,
    TRouteDef extends RouteDef,
  >(
    method: TMethod,
    path: TPath,
    def: TRouteDef,
    handler: RouteHandler<TAppData, TPath, TRouteDef>,
  ): App<
    MergeAppData<
      TAppData,
      { routes: { [method in TMethod]: { [path in TPath]: TRouteDef } } }
    >
  >;

  /**
   * Mount another fetch function at `/**`.
   */
  mount(
    fetch: ServerSideFetch,
  ): App<MergeAppData<TAppData, { routes: { ANY: { "/**": AnyDef } } }>>;
  /**
   * Mount another fetch function at `${path}/**`.
   */
  mount<TPath extends BasePath>(
    path: TPath,
    fetch: ServerSideFetch,
  ): App<
    MergeAppData<
      TAppData,
      { routes: { ANY: { [path in `${TPath}/**`]: AnyDef } } }
    >
  >;
  /**
   * Mount another fetch function at `${path}/**`.
   */
  mount<TPath extends BasePath, TRouteDef extends RouteDef>(
    path: TPath,
    def: TRouteDef,
    fetch: ServerSideFetch,
  ): App<
    MergeAppData<
      TAppData,
      { routes: { ANY: { [path in `${TPath}/**`]: TRouteDef } } }
    >
  >;

  /**
   * Add a subapp to the app.
   */
  use<TNewApp extends App>(
    app: TNewApp,
  ): App<UseAppData<TAppData, GetAppData<TNewApp>>>;
}

/**
 * Given an `App`, return it's `AppData`.
 */
export type GetAppData<TApp extends App> =
  TApp extends App<infer TAppData> ? TAppData : never;

/**
 * Given an `App`, return the routes defined on it.
 */
export type GetAppRoutes<TApp extends App> = GetAppData<TApp>["routes"];

/**
 * Data stored internally for each route inside the `rou3` router.
 */
export type RouterData = {
  def?: RouteDef;
  route: string;
  hooks: LifeCycleHooks;
  compiledHandler: CompiledRouteHandler;
} & (
  | { fetch: ServerSideFetch }
  | { handler: (ctx: OnBeforeHandleContext) => Promise<any> }
);

/**
 * Function type called internally once a route is matched for a request.
 */
export type CompiledRouteHandler = (
  request: Request,
  ctx: any,
) => MaybePromise<Response>;

//
// HANDLERS
//

/**
 * Type of the callback function used for each route.
 */
export type RouteHandler<
  TAppData extends AppData,
  TPath extends BasePath,
  TRouteDef extends RouteDef,
> = (
  ctx: BuildHandlerContext<TAppData, TPath, TRouteDef>,
) => MaybePromise<GetRouteHandlerReturnType<TRouteDef>>;

export type GetRouteHandlerReturnType<TRouteDef extends RouteDef> =
  TRouteDef extends { responses: symbol } // is any check
    ? any
    : TRouteDef extends { responses: infer TResponses }
      ? TResponses extends StandardSchemaV1
        ? StandardSchemaV1.InferInput<TResponses>
        : TRouteDef["responses"] extends Record<number, StandardSchemaV1<any>>
          ? StatusResult
          : never
      : void;

/**
 * Given an `App`, a method, and a route, return the handler function's type.
 */
export type GetRouteHandler<
  TApp extends App,
  TMethod extends keyof GetAppRoutes<TApp>,
  TRoute extends keyof GetAppRoutes<TApp>[TMethod],
> = TRoute extends BasePath
  ? GetAppRoutes<TApp>[TMethod][TRoute] extends RouteDef
    ? RouteHandler<
        GetAppData<TApp>,
        TRoute,
        GetAppRoutes<TApp>[TMethod][TRoute]
      >
    : never
  : never;

//
// LIFECYCLE HOOKS
//

/**
 * Internal type used to store a hook on an app.
 */
export type LifeCycleHook<TCallback extends Function> = {
  /**
   * Used for deducplication.
   */
  id: string;
  /**
   * Where this plugin should be applied.
   * - `global`: Global plugins are hoisted to the top-level app.
   * - `local`: Local plugins are applied to the app they were added to.
   * @default "local"
   */
  applyTo: "global" | "local";
  /**
   * The function called when the hook is triggered.
   */
  callback: TCallback;
};

/**
 * Called immediately after receiving the request. Returned record is merged
 * into the handler context.
 */
export type OnGlobalRequestHook = LifeCycleHook<
  (ctx: Simplify<OnGlobalRequestContext>) => Record<string, any> | void
>;

/**
 * Called before validating the request inputs. Returned record is merged into
 * the handler context.
 */
export type OnTransformHook = LifeCycleHook<
  (
    ctx: Simplify<OnTransformContext>,
  ) => MaybePromise<Record<string, any> | void>
>;

/**
 * Called before calling the route handler. Returned record is merged into the
 * handler context.
 */
export type OnBeforeHandleHook = LifeCycleHook<
  (
    ctx: Simplify<OnBeforeHandleContext>,
  ) => MaybePromise<Record<string, any> | void>
>;

/**
 * Called after calling the route handler. If there is a return value, it
 * replaces the return value from the handler. Similar to the `onTransform` hook,
 * but for the response.
 */
export type OnAfterHandleHook = LifeCycleHook<
  (ctx: Simplify<AfterHandleContext>) => MaybePromise<unknown | void>
>;

/**
 * Called after validating the handler return value. Used to transform the
 * return value into a `Response`.
 */
export type OnMapResponseHook = LifeCycleHook<
  (ctx: Simplify<OnMapResponseContext>) => MaybePromise<Response | void>
>;

/**
 * Called if an error is thrown in any other hook other than `onGlobalAfterResponse`.
 *
 * Zeta will handle any `HttpError`s thrown, but you can handle your own errors
 * here.
 */
export type OnGlobalErrorHook = LifeCycleHook<
  (ctx: Simplify<OnGlobalErrorContext>) => void
>;

/**
 * Called after the response is sent back to the client.
 */
export type OnGlobalAfterResponseHook = LifeCycleHook<
  (ctx: Simplify<AfterResponseContext>) => void
>;

export type LifeCycleHooks = {
  onGlobalRequest?: OnGlobalRequestHook[];
  onTransform?: OnTransformHook[];
  onBeforeHandle?: OnBeforeHandleHook[];
  onAfterHandle?: OnAfterHandleHook[];
  onMapResponse?: OnMapResponseHook[];
  onGlobalError?: OnGlobalErrorHook[];
  onGlobalAfterResponse?: OnGlobalAfterResponseHook[];
};

export type LifeCycleHookName = keyof LifeCycleHooks;

//
// BASE TYPES
//

/**
 * Base data type associated with each app.
 */
export type AppData = {
  exported: boolean;
  prefix: BasePrefix;
  ctx: BaseCtx;
  routes: BaseRoutes;
};

/**
 * Minimal data type that works with `AppData`.
 */
export type DefaultAppData = {
  exported: false;
  prefix: "";
  ctx: {};
  routes: {};
};

/**
 * Minimal data type that matches `AppData["ctx"]`.
 */
export type BaseCtx = Record<string, any>;

/**
 * Minimal data type that matches `AppData["routes"]`.
 */
export type BaseRoutes = {
  [method: string]: {
    [path: BasePath]: RouteDef;
  };
};

/**
 * Minimal data type that matches `AppData["routes"][method][path]`, containing information about the route.
 */
export type RouteDef = Simplify<
  Omit<OpenAPI.Operation, "parameters" | "responses"> & {
    headers?: StandardSchemaV1<Record<string, any>>;
    params?: StandardSchemaV1<Record<string, any>>;
    query?: StandardSchemaV1<Record<string, any>>;
    body?: StandardSchemaV1;
    responses?: StandardSchemaV1 | Record<number, StandardSchemaV1>;
  }
>;

/**
 * Used for `TDef` when a route definition is not passed. Essentially removes type-safety from a route.
 */
export type AnyDef = {
  headers: StandardSchemaV1<Record<string, string>>;
  params: StandardSchemaV1<Record<string, string>>;
  query: StandardSchemaV1<Record<string, string>>;
  body: StandardSchemaV1<any>;
  responses: any;
};

/**
 * Base type representing what strings can be passed as a `prefix` when creating an app.
 */
export type BasePrefix = BasePath | "";

/**
 * Base type representing what a route's string must look like.
 */
export type BasePath = `/${string}`;

//
// CONTEXT OBJECTS
//

/**
 * `ctx` type used in the `onGlobalRequest` hook.
 */
export type OnGlobalRequestContext<TCtx extends BaseCtx = {}> = TCtx & {
  request: Request;
  url: URL;
  path: string;
  method: string;
  set: Setter;
};

/**
 * `ctx` type used in the `onTransform` hook.
 */
export type OnTransformContext<TCtx extends BaseCtx = {}> =
  OnGlobalRequestContext<TCtx> & {
    route: string;
    params?: Record<string, string>;
    query?: Record<string, string>;
    headers?: Record<string, string>;
    body?: any;
  };

/**
 * `ctx` type used in the `onBeforeHandle` hook.
 */
export type OnBeforeHandleContext<TCtx extends BaseCtx = {}> =
  OnTransformContext<TCtx>;

/**
 * `ctx` type used in the `onAfterHandle` hook.
 */
export type AfterHandleContext<TCtx extends BaseCtx = {}> =
  OnTransformContext<TCtx> & {
    response?: unknown;
  };

/**
 * `ctx` type used in the `onMapResponse` hook.
 */
export type OnMapResponseContext<TCtx extends BaseCtx = {}> =
  AfterHandleContext<TCtx> & {};

/**
 * `ctx` type used in the `onGlobalError` hook.
 */
export type OnGlobalErrorContext<TCtx extends BaseCtx = {}> =
  OnGlobalRequestContext<TCtx> &
    Partial<OnMapResponseContext> & { error: unknown };

/**
 * `ctx` type used in the `onGlobalAfterResponse` hook.
 */
export type AfterResponseContext<TCtx extends BaseCtx = {}> =
  OnGlobalRequestContext<TCtx> &
    Partial<OnMapResponseContext> & { response: Response };

/**
 * Given an `AppData` type, return the type of it's `ctx`.
 */
export type GetAppDataCtx<TAppData extends AppData> = TAppData extends {
  ctx: infer TCtx;
}
  ? TCtx
  : never;

export type StatusFn<TMap extends Record<any, any>> = TMap extends never
  ? never
  : <TStatus extends keyof TMap>(
      status: TStatus,
      body: StandardSchemaV1.InferInput<TMap[TStatus]>,
    ) => StatusResult;

export type GetResponseStatusMap<TRouteDef extends RouteDef> =
  TRouteDef extends { responses: unknown }
    ? TRouteDef["responses"] extends symbol // is any check
      ? Record<number, StandardSchemaV1<any, any>>
      : TRouteDef["responses"] extends StandardSchemaV1
        ? { 200: TRouteDef["responses"] }
        : TRouteDef["responses"] extends Record<
              number | string,
              StandardSchemaV1
            >
          ? TRouteDef["responses"]
          : any
    : never;

export type StatusResult = {
  [IsStatusResult]: true;
  status: number;
  body: unknown;
};

/**
 * Build the `ctx` type used for request handlers.
 */
export type BuildHandlerContext<
  TAppData extends AppData,
  TPath extends BasePath,
  TRouteDef extends RouteDef,
> = Simplify<
  Omit<OnBeforeHandleContext<GetAppDataCtx<TAppData>>, InputParams> & {
    route: TPath;
  } & GetRequestParamsOutputFromDef<TRouteDef> & {
      status: StatusFn<GetResponseStatusMap<TRouteDef>>;
    }
>;

//
// MERGING OBJECTS
//

/**
 * Given two `App`s, merge their data to match the behavior of `TParent.use(TChild)`.
 */
export type UseApp<TParent extends App, TChild extends App> = App<
  Simplify<UseAppData<GetAppData<TParent>, GetAppData<TChild>>>
>;

/**
 * Same as `UseApp`, but instead of app instances, it merges the `AppData` of each.
 */
export type UseAppData<
  TParentData extends AppData,
  TChildData extends AppData,
> = TChildData extends { exported: true }
  ? MergeAppData<
      TParentData,
      Pick<ApplyAppDataPrefix<TChildData>, "ctx" | "routes">
    >
  : MergeAppData<TParentData, Pick<ApplyAppDataPrefix<TChildData>, "routes">>;

/**
 * Merge two `App` types together. See `MergeAppData` for details.
 */
export type MergeApp<T1, T2> =
  T1 extends App<infer D1>
    ? T2 extends App<infer D2>
      ? App<Simplify<MergeAppData<D1, D2>>>
      : never
    : never;

/**
 * Merge two `AppData` types together.
 * - `prefix`: The second app's prefix overrides the first if present.
 * - `ctx`: The second app's context gets merged with the first if present. Any
 *   existing keys are overwritten to match the second app's context.
 * - `exported`: The second app's exported status overrides the first if
 *   present.
 * - `routes`: See `MergeRoutes` for details.
 */
export type MergeAppData<
  T1 extends AppData,
  T2 extends Partial<AppData>,
> = Simplify<{
  prefix: T2["prefix"] extends string ? T2["prefix"] : T1["prefix"];
  ctx: T2["ctx"] extends BaseCtx
    ? Simplify<Spread<T1["ctx"], T2["ctx"]>>
    : T1["ctx"];
  exported: T2["exported"] extends boolean ? T2["exported"] : T1["exported"];
  routes: T2["routes"] extends BaseRoutes
    ? Simplify<MergeRoutes<T1["routes"], T2["routes"]>>
    : T1["routes"];
}>;

/**
 * Merges two route objects together, 2 levels deep. If the same method/path
 * combination exists in both apps, the second app's route overrides the first.
 */
export type MergeRoutes<
  A extends Record<string, any>,
  B extends Record<string, any>,
> = Simplify<Merge<A, B>>;

//
// APPLY PREFIX
//

/**
 * Given an app and a new prefix, return a new app type with app's original
 * prefix applied to each route, and with the new prefix stored in the
 * `AppData`.
 */
export type ApplyAppPrefix<
  TApp extends App,
  TNewPrefix extends BasePrefix = "",
> = App<Simplify<ApplyAppDataPrefix<GetAppData<TApp>, TNewPrefix>>>;

/**
 * Same as `ApplyAppPrefix`, but at the `AppData` level.
 */
export type ApplyAppDataPrefix<
  TAppData extends AppData,
  TNewPrefix extends BasePrefix = "",
> = {
  ctx: TAppData["ctx"];
  exported: TAppData["exported"];
  prefix: TNewPrefix;
  routes: TAppData["prefix"] extends BasePath
    ? {
        [TMethod in keyof TAppData["routes"]]: Simplify<
          PrefixObjectKeys<TAppData["prefix"], TAppData["routes"][TMethod]>
        >;
      }
    : TAppData["routes"];
};

//
// SCHEMA CONVERSION
//

/**
 * Given a route definition, return the input types of all the params.
 */
export type GetRequestParamsInputFromDef<TRouteDef extends RouteDef> =
  TRouteDef extends AnyDef
    ? {
        headers?: Record<string, string>;
        params?: Record<string, string>;
        query?: Record<string, string>;
        body?: any;
      }
    : Simplify<{
        [key in keyof GetDefParams<TRouteDef>]: TRouteDef[key] extends StandardSchemaV1
          ? StandardSchemaV1.InferInput<TRouteDef[key]>
          : never;
      }>;

/**
 * Given a set of routes, a method, and a route, return the input types of all
 * the schemas in the route definition.
 */
export type GetRequestParamsInput<
  TRoutes extends BaseRoutes,
  TMethod extends keyof TRoutes,
  TRoute extends keyof TRoutes[TMethod],
> = TRoute extends BasePath
  ? GetRequestParamsInputFromDef<TRoutes[TMethod][TRoute]>
  : never;

/**
 * Given a route definition, return the input type of the response schema.
 */
export type GetResponseInputFromDef<TRouteDef extends RouteDef> =
  TRouteDef["responses"] extends undefined
    ? undefined
    : TRouteDef["responses"] extends StandardSchemaV1
      ? StandardSchemaV1.InferInput<TRouteDef["responses"]>
      : never;

/**
 * Given a set of routes, a method, and a route, return the input type of the
 * response schema in the route definition.
 */
export type GetResponseInput<
  TRoutes extends BaseRoutes,
  TMethod extends keyof TRoutes,
  TPath extends keyof TRoutes[TMethod],
> = TPath extends BasePath
  ? GetResponseInputFromDef<TRoutes[TMethod][TPath]>
  : never;

/**
 * Helper type for converting a schema or object containing schemas to their
 * output types.
 */
type ToStandardSchemaOutputs<T> = T extends StandardSchemaV1
  ? StandardSchemaV1.InferOutput<T>
  : T extends { [key in keyof T]: any }
    ? { [key in keyof T]: ToStandardSchemaOutputs<T[key]> }
    : never;

/**
 * Given a route definition, return the output type of the param schemas.
 */
export type GetRequestParamsOutputFromDef<TRouteDef extends RouteDef> =
  ToStandardSchemaOutputs<GetDefParams<TRouteDef>>;

/**
 * Given a set of routes, a method, and a route, return the output type of the
 * param schemas.
 */
export type GetRequestParamsOutput<
  TRoutes extends BaseRoutes,
  TMethod extends keyof TRoutes,
  TRoute extends keyof TRoutes[TMethod],
> = TRoute extends BasePath
  ? GetRequestParamsOutputFromDef<TRoutes[TMethod][TRoute]>
  : never;

type SuccessStatusCodes =
  | 200
  | HttpStatus.Ok
  | 201
  | HttpStatus.Created
  | 202
  | HttpStatus.Accepted
  | 203
  | HttpStatus.NonAuthoritativeInformation
  | 204
  | HttpStatus.NoContent
  | 205
  | HttpStatus.ResetContent
  | 206
  | HttpStatus.PartialContent
  | 207
  | HttpStatus.MultiStatus
  | 208
  | HttpStatus.AlreadyReported
  | 226
  | HttpStatus.ImUsed;

/**
 * Given a `RouteDef`, return a union of all possible handler return values.
 *
 * If `responses` is defined, it will be a discriminated union of objects
 * containing the status and body.
 *
 * If only `response` is defined, it will be the output of that schema.
 *
 * If neither is defined, it will be `void`.
 */
export type GetResponseOutputFromDef<TRouteDef extends RouteDef> =
  TRouteDef["responses"] extends undefined
    ? undefined
    : TRouteDef["responses"] extends StandardSchemaV1
      ? StandardSchemaV1.InferOutput<TRouteDef["responses"]>
      : {
          [key in SuccessStatusCodes &
            keyof TRouteDef["responses"]]: TRouteDef["responses"][key] extends StandardSchemaV1
            ? StandardSchemaV1.InferOutput<TRouteDef["responses"][key]>
            : unknown;
        }[SuccessStatusCodes & keyof TRouteDef["responses"]];

/**
 * Given a set of routes, a method, and a route, return the output type of the
 * response schema.
 */
export type GetResponseOutput<
  TRoutes extends BaseRoutes,
  TMethod extends keyof TRoutes,
  TPath extends keyof TRoutes[TMethod],
> = TPath extends BasePath
  ? GetResponseOutputFromDef<TRoutes[TMethod][TPath]>
  : 1;

type InputParams = "headers" | "params" | "query" | "body";

/**
 * Given a route definition, return an object with only the input parameeters.
 */
type GetDefParams<TRouteDef extends RouteDef> = {
  [key in InputParams & keyof TRouteDef]: TRouteDef[key];
};

//
// SCHEMA ADAPTER
//

/**
 * To generate open API docs, Zeta needs to know how process and extract
 * some information from your schema. This adapter is responsible for
 * providing additional functions for parsing your schema.
 */
export interface SchemaAdapter {
  /**
   * Convert a standard schema definition to it's JSON schema.
   * @param schema The schema to convert.
   * @returns The JSON schema.
   */
  toJsonSchema: (schema: any) => any;
  getMeta: (schema: StandardSchemaV1) => Record<string, any> | undefined;
}

//
// TRANSPORTS
//

export interface Transport {
  listen: (port: number, fetch: ServerSideFetch, cb?: () => void) => void;
}

//
// SETTER
//

/**
 * Basic object type used to store custom status and headers set while handling the request.
 */
export interface Setter {
  /**
   * Set this value to change the status code returned.
   */
  status: number;
  /**
   * Set a value on this header to change which headers are sent in the response.
   */
  headers: Record<string, string>;
}

//
// GENERAL UTILS
//

/**
 * Given a union of objects, combine them into a single object that's easy to read.
 */
export type Simplify<T> = T extends { [key: string]: any }
  ? { [K in keyof T]: T[K] }
  : T;

/**
 * Returns either a Promise of a type or just the type itself.
 */
export type MaybePromise<T> = Promise<T> | T;

/**
 * A function that, given a request, returns a response. This type is compliant with WinterCG.
 */
export type ServerSideFetch = (request: Request) => MaybePromise<Response>;

/**
 * Apply a string prefix to all the keys of an object.
 */
export type PrefixObjectKeys<
  TPrefix extends string,
  TObject extends Record<string, unknown>,
> = {
  [K in keyof TObject as `${TPrefix}${string & K extends "/" ? "" : string & K}`]: TObject[K];
};

/**
 * A helper type that models a single-level object spread: { ...L, ...R }
 * It takes all properties from R, and all properties from L that are not in R.
 */
type Spread<L, R> = Omit<L, keyof R> & R;

/**
 * Merges two objects, A and B, two levels deep.
 *
 * It combines the keys from both A and B.
 * - If a key exists only in A or only in B, it's carried over.
 * - If a key exists in *both* A and B, it recursively merges their
 *   values using a single-level spread (`Spread<A[K], B[K]>`).
 * This ensures properties from B's inner objects overwrite those from A's.
 */
export type Merge<A, B> = Omit<A, keyof B> & {
  [K in keyof B]: K extends keyof A ? Simplify<Spread<A[K], B[K]>> : B[K];
};
