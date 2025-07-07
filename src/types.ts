/**
 * Types used internally by Zeta to build the type system. You probably don't
 * need to use these, and there is no guarantee that they will remain stable
 * between non-major versions.
 *
 * @internal Subject to breaking changes outside of major versions.
 * @module
 */
import type { StandardSchemaV1 } from "@standard-schema/spec";

//
// APP
//

export interface App<TAppData extends BaseAppData = BaseAppData> {
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
   * Mark the app as "exported". When an exported app is `use`d by a
   * parent app, the parent app will inherit all of it's hooks and modifiers.
   *
   * Regular, non-exported apps isolate their hooks and modifiers from the
   * parent app (except for the global hooks, `onRequest`, `onError`, and
   * `afterResponse`, which are always inherited by the parent app).
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
   * returns a value, it will be merged into the `ctx` object.
   *
   * @param callback The function to call.
   */
  onRequest(
    callback: (
      ctx: OnRequestContext<GetAppDataCtx<TAppData>>,
    ) => MaybePromise<void>,
  ): this;
  onRequest<TNewCtx extends Record<string, any>>(
    callback: (
      ctx: OnRequestContext<GetAppDataCtx<TAppData>>,
    ) => MaybePromise<TNewCtx>,
  ): App<MergeAppData<TAppData, { ctx: TNewCtx }>>;

  /**
   * Add a callback that is called when an error is thrown. The callback can
   * optionally return a `Response`, which will be used to respond to the
   * client.
   *
   * @param callback The function to call.
   */
  onError(
    callback: (
      ctx: OnErrorContext<GetAppDataCtx<TAppData>>,
    ) => MaybePromise<void>,
  ): this;

  /**
   * Add a callback that is called after the response is sent.
   * @param callback The function to call.
   */
  afterResponse(
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
  get<TPath extends BasePath, TDef extends BaseDef>(
    path: TPath,
    def: TDef,
    handler: RouteHandler<TAppData, TPath, TDef>,
  ): App<
    MergeAppData<TAppData, { routes: { GET: { [path in TPath]: TDef } } }>
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
  post<TPath extends BasePath, TDef extends BaseDef>(
    path: TPath,
    def: TDef,
    handler: RouteHandler<TAppData, TPath, TDef>,
  ): App<
    MergeAppData<TAppData, { routes: { POST: { [path in TPath]: TDef } } }>
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
  put<TPath extends BasePath, TDef extends BaseDef>(
    path: TPath,
    def: TDef,
    handler: RouteHandler<TAppData, TPath, TDef>,
  ): App<
    MergeAppData<TAppData, { routes: { PUT: { [path in TPath]: TDef } } }>
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
  delete<TPath extends BasePath, TDef extends BaseDef>(
    path: TPath,
    def: TDef,
    handler: RouteHandler<TAppData, TPath, TDef>,
  ): App<
    MergeAppData<TAppData, { routes: { DELETE: { [path in TPath]: TDef } } }>
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
  any<TPath extends BasePath, TDef extends BaseDef>(
    path: TPath,
    def: TDef,
    handler: RouteHandler<TAppData, TPath, AnyDef>,
  ): App<
    MergeAppData<TAppData, { routes: { ANY: { [path in TPath]: TDef } } }>
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
  method<TMethod extends string, TPath extends BasePath, TDef extends BaseDef>(
    method: TMethod,
    path: TPath,
    def: TDef,
    handler: RouteHandler<TAppData, TPath, TDef>,
  ): App<
    MergeAppData<
      TAppData,
      { routes: { [method in TMethod]: { [path in TPath]: TDef } } }
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
  mount<TPath extends BasePath, TDef extends BaseDef>(
    path: TPath,
    def: TDef,
    fetch: ServerSideFetch,
  ): App<
    MergeAppData<
      TAppData,
      { routes: { ANY: { [path in `${TPath}/**`]: TDef } } }
    >
  >;

  /**
   * Add a subapp to the app.
   */
  use<TNewApp extends App>(
    app: TNewApp,
  ): App<UseAppData<TAppData, GetAppData<TNewApp>>>;
}

export type GetAppData<TApp extends App> =
  TApp extends App<infer TAppData> ? TAppData : never;

export type GetAppRoutes<TApp extends App> = GetAppData<TApp>["routes"];

export type RouterData = {
  def?: BaseDef;
  route: string;
  hooks: LifeCycleHooks;
} & (
  | { fetch: ServerSideFetch }
  | { handler: (ctx: BeforeHandleContext) => Promise<any> }
);

//
// HANDLERS
//

export type RouteHandler<
  TAppData extends BaseAppData,
  TPath extends BasePath,
  TDef extends BaseDef,
> = (
  ctx: BuildHandlerContext<TAppData, TPath, TDef>,
) => MaybePromise<GetResponseInputFromDef<TDef>>;

export type GetRouteHandler<
  TApp extends App,
  TMethod extends keyof GetAppRoutes<TApp>,
  TPath extends keyof GetAppRoutes<TApp>[TMethod],
> = TPath extends BasePath
  ? GetAppRoutes<TApp>[TMethod][TPath] extends BaseDef
    ? RouteHandler<GetAppData<TApp>, TPath, GetAppRoutes<TApp>[TMethod][TPath]>
    : never
  : never;

//
// LIFECYCLE HOOKS
//

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
export type OnRequestHook = LifeCycleHook<
  (ctx: Simplify<OnRequestContext>) => MaybePromise<Record<string, any> | void>
>;

/**
 * Called before validating the request inputs. Returned record is merged into
 * the handler context.
 */
export type TransformHook = LifeCycleHook<
  (ctx: Simplify<TransformContext>) => MaybePromise<Record<string, any> | void>
>;

/**
 * Called before calling the route handler. Returned record is merged into the
 * handler context.
 */
export type BeforeHandleHook = LifeCycleHook<
  (
    ctx: Simplify<BeforeHandleContext>,
  ) => MaybePromise<Record<string, any> | void>
>;

/**
 * Called after calling the route handler. If there is a return value, it
 * replaces the return value from the handler. Similar to the `transform` hook,
 * but for the response.
 */
export type AfterHandleHook = LifeCycleHook<
  (ctx: Simplify<AfterHandleBaseContext>) => MaybePromise<unknown | void>
>;

/**
 * Called after validating the handler return value. Used to transform the
 * return value into a `Response`.
 */
export type MapResponseHook = LifeCycleHook<
  (ctx: Simplify<MapResponseBaseContext>) => MaybePromise<Response | void>
>;

/**
 * Called if an error is thrown in any other hook other than `afterResponse`.
 * Use this hook to transform custom errors into a `Response`.
 *
 * Zeta will handle any `HttpError`s thrown, but you can handle your own errors
 * here.
 */
export type OnErrorHook = LifeCycleHook<
  (ctx: Simplify<OnErrorContext>) => MaybePromise<Response | void>
>;

/**
 * Called after the response is sent back to the client.
 */
export type AfterResponseHook = LifeCycleHook<
  (ctx: Simplify<AfterResponseContext>) => MaybePromise<void>
>;

export type LifeCycleHooks = {
  onRequest: OnRequestHook[];
  transform: TransformHook[];
  beforeHandle: BeforeHandleHook[];
  afterHandle: AfterHandleHook[];
  mapResponse: MapResponseHook[];
  onError: OnErrorHook[];
  afterResponse: AfterResponseHook[];
};

//
// BASE TYPES
//

export type BaseAppData = {
  exported: boolean;
  prefix: BasePrefix;
  ctx: BaseCtx;
  routes: BaseRoutes;
};
export type DefaultAppData = {
  exported: false;
  prefix: "";
  ctx: {};
  routes: {};
};

export type BaseCtx = Record<string, any>;

export type BaseRoutes = {
  [method: string]: {
    [path: BasePath]: BaseDef;
  };
};

export type BaseDef = {
  headers?: StandardSchemaV1<Record<string, any>>;
  params?: StandardSchemaV1<Record<string, any>>;
  query?: StandardSchemaV1<Record<string, any>>;
  body?: StandardSchemaV1;
  response?: StandardSchemaV1;
};

export type AnyDef = {
  headers: StandardSchemaV1<Record<string, string>>;
  params: StandardSchemaV1<Record<string, string>>;
  query: StandardSchemaV1<Record<string, string>>;
  body: StandardSchemaV1<any>;
  response: StandardSchemaV1<any>;
};

export type BasePrefix = BasePath | "";

export type BasePath = `/${string}`;

//
// CONTEXT OBJECTS
//

export type OnRequestContext<TCtx extends BaseCtx = {}> = TCtx & {
  request: Request;
  url: URL;
  path: string;
  method: string;
};

export type TransformContext<TCtx extends BaseCtx = {}> =
  OnRequestContext<TCtx> & {
    route: string;
    params?: Record<string, string>;
    query?: Record<string, string>;
    headers?: Record<string, string>;
    body?: any;
  };

export type BeforeHandleContext<TCtx extends BaseCtx = {}> =
  TransformContext<TCtx>;

export type AfterHandleBaseContext<TCtx extends BaseCtx = {}> =
  TransformContext<TCtx> & {
    response?: unknown;
  };

export type MapResponseBaseContext<TCtx extends BaseCtx = {}> =
  AfterHandleBaseContext<TCtx> & {};

export type OnErrorContext<TCtx extends BaseCtx = {}> = OnRequestContext<TCtx> &
  Partial<MapResponseBaseContext> & { error: unknown };

export type AfterResponseContext<TCtx extends BaseCtx = {}> =
  OnRequestContext<TCtx> &
    Partial<MapResponseBaseContext> & { response: Response };

export type GetAppDataCtx<TAppData extends BaseAppData> = TAppData extends {
  ctx: infer TCtx;
}
  ? TCtx
  : never;

export type BuildHandlerContext<
  TAppData extends BaseAppData,
  TPath extends BasePath,
  TDef extends BaseDef,
> = Simplify<
  GetAppDataCtx<TAppData> & {
    route: TPath;
    request: Request;
  } & GetRequestParamsOutputFromDef<TDef>
>;

//
// MERGING OBJECTS
//

export type UseApp<TParent extends App, TChild extends App> = App<
  Simplify<UseAppData<GetAppData<TParent>, GetAppData<TChild>>>
>;

export type UseAppData<
  TParentData extends BaseAppData,
  TChildData extends BaseAppData,
> = TChildData extends { exported: true }
  ? MergeAppData<
      TParentData,
      Pick<ApplyAppDataPrefix<TChildData>, "ctx" | "routes">
    >
  : MergeAppData<TParentData, Pick<ApplyAppDataPrefix<TChildData>, "routes">>;

export type MergeApp<T1, T2> =
  T1 extends App<infer D1>
    ? T2 extends App<infer D2>
      ? App<Simplify<MergeAppData<D1, D2>>>
      : never
    : never;

export type MergeAppData<
  T1 extends BaseAppData,
  T2 extends Partial<BaseAppData>,
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

export type MergeRoutes<
  A extends Record<string, any>,
  B extends Record<string, any>,
> = Simplify<Merge<A, B>>;

//
// APPLY PREFIX
//

export type ApplyAppPrefix<
  TApp extends App,
  TNewPrefix extends BasePrefix = "",
> = App<Simplify<ApplyAppDataPrefix<GetAppData<TApp>, TNewPrefix>>>;

export type ApplyAppDataPrefix<
  TAppData extends BaseAppData,
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

export type GetRequestParamsInputFromDef<TDef extends BaseDef> =
  TDef extends AnyDef
    ? {
        headers?: Record<string, string>;
        params?: Record<string, string>;
        query?: Record<string, string>;
        body?: any;
      }
    : Simplify<{
        [key in keyof GetDefParams<TDef>]: TDef[key] extends StandardSchemaV1
          ? StandardSchemaV1.InferInput<TDef[key]>
          : never;
      }>;

export type GetRequestParamsInput<
  TRoutes extends BaseRoutes,
  TMethod extends keyof TRoutes,
  TPath extends keyof TRoutes[TMethod],
> = TPath extends BasePath
  ? GetRequestParamsInputFromDef<TRoutes[TMethod][TPath]>
  : never;

export type GetResponseInputFromDef<TDef extends BaseDef> = TDef extends {
  response: infer TResponse;
}
  ? TResponse extends StandardSchemaV1
    ? StandardSchemaV1.InferInput<TResponse>
    : never
  : void;

export type GetResponseInput<
  TRoutes extends BaseRoutes,
  TMethod extends keyof TRoutes,
  TPath extends keyof TRoutes[TMethod],
> = TPath extends BasePath
  ? GetResponseInputFromDef<TRoutes[TMethod][TPath]>
  : never;

type ToStandardSchemaOutputs<T> = T extends StandardSchemaV1
  ? StandardSchemaV1.InferOutput<T>
  : T extends { [key in keyof T]: any }
    ? { [key in keyof T]: ToStandardSchemaOutputs<T[key]> }
    : never;

export type GetRequestParamsOutputFromDef<TDef extends BaseDef> =
  ToStandardSchemaOutputs<GetDefParams<TDef>>;

export type GetRequestParamsOutput<
  TRoutes extends BaseRoutes,
  TMethod extends keyof TRoutes,
  TPath extends keyof TRoutes[TMethod],
> = TPath extends BasePath
  ? GetRequestParamsOutputFromDef<TRoutes[TMethod][TPath]>
  : never;

export type GetResponseOutputFromDef<TDef extends BaseDef> = TDef extends {
  response: infer TSchema extends StandardSchemaV1;
}
  ? StandardSchemaV1.InferOutput<TSchema>
  : void;

export type GetResponseOutput<
  TRoutes extends BaseRoutes,
  TMethod extends keyof TRoutes,
  TPath extends keyof TRoutes[TMethod],
> = TPath extends BasePath
  ? GetResponseOutputFromDef<TRoutes[TMethod][TPath]>
  : never;

type GetDefParams<TDef extends BaseDef> = Omit<TDef, "response">;

//
// GENERAL UTILS
//

/**
 * Given a union of objects, combine them into a single object that's easy to read.
 */
export type Simplify<T> = T extends { [key: string]: any }
  ? { [K in keyof T]: T[K] }
  : T;

export type MaybePromise<T> = Promise<T> | T;

/**
 * A function that, given a request, returns a response. This type is compliant with WinterCG.
 */
export type ServerSideFetch = (request: Request) => MaybePromise<Response>;

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
