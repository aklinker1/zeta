import type { StandardSchemaV1 } from "@standard-schema/spec";

//
// APP
//

export interface App<TAppData extends BaseAppData = {}> {
  "~zeta": {
    /**
     * Path prefix from `CreateAppOptions.prefix`.
     * @internal
     */
    prefix: string;

    /**
     * List of routes registered with the app.
     * @internal
     */
    routes: { [method: string]: { [path: string]: RouterData } };
  };

  /** Merge and simplify all the app routes into a single fetch function. */
  build: () => ServerSideFetch;

  /**
   * Add a static value to the handler context.
   */
  decorate<TKey extends string, TValue>(
    key: TKey,
    value: TValue,
  ): App<MergeAppData<TAppData, { ctx: { [key in TKey]: Readonly<TValue> } }>>;

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
   * Add a subapp to the app.
   */
  use<TNewApp extends App>(
    app: TNewApp,
  ): MergeApp<this, ApplyAppPrefix<TNewApp>>;
}

export type GetAppData<TApp extends App> =
  TApp extends App<infer TAppData> ? TAppData : never;

export type GetAppRoutes<TApp extends App> =
  TApp extends App<infer TAppData> ? TAppData["routes"] : never;

export type RouterData = {
  def?: BaseDef;
  route: string;
} & ({ fetch: ServerSideFetch } | { handler: (ctx: any) => Promise<any> });

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

export type BuildHandlerContext<
  TAppData extends BaseAppData,
  TPath extends BasePath,
  TDef extends BaseDef,
> = Simplify<
  (TAppData extends { ctx: infer Ctx } ? Ctx : {}) & {
    route: TPath;
    request: Request;
  } & GetRequestParamsOutputFromDef<TDef>
>;

//
// BASE TYPES
//

export type BaseAppData = {
  base?: BasePath;
  ctx?: BaseCtx;
  routes?: BaseRoutes;
};

export type BaseCtx = Record<string, any>;

export type BaseRoutes = {
  [method: string]: {
    [path: string]: BaseDef;
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

export type BasePath = `/${string}`;

//
// MERGING OBJECTS
//

export type MergeApp<T1, T2> =
  T1 extends App<infer D1>
    ? T2 extends App<infer D2>
      ? App<Simplify<MergeAppData<D1, D2>>>
      : never
    : never;

export type MergeAppData<
  T1 extends BaseAppData,
  T2 extends BaseAppData,
> = Simplify<{
  [key in keyof T1 | keyof T2]: key extends "ctx"
    ? MergeCtx<
        T1 extends { ctx: infer C1 } ? C1 : undefined,
        T2 extends { ctx: infer C2 } ? C2 : undefined
      >
    : key extends "routes"
      ? MergeRoutes<
          T1 extends { routes: infer R1 } ? R1 : undefined,
          T2 extends { routes: infer R2 } ? R2 : undefined
        >
      : key extends keyof T2
        ? T2[key]
        : key extends keyof T1
          ? T1[key]
          : never;
}>;

export type MergeCtx<
  T1 extends BaseCtx | undefined,
  T2 extends BaseCtx | undefined,
> = T1 extends BaseCtx
  ? T2 extends BaseCtx
    ? Simplify<ShallowMergeObjects<T1, T2>>
    : T1
  : T2;

export type MergeRoutes<
  T1 extends BaseRoutes | undefined,
  T2 extends BaseRoutes | undefined,
> = T2 extends BaseRoutes
  ? T1 extends BaseRoutes
    ? {
        [method in keyof T1 | keyof T2]: method extends keyof T2
          ? method extends keyof T1
            ? Simplify<ShallowMergeObjects<T1[method], T2[method]>>
            : T2[method]
          : method extends keyof T1
            ? T1[method]
            : never;
      }
    : T2
  : T1;

export type ShallowMergeObjects<
  T1 extends Record<string, any>,
  T2 extends Record<string, any>,
> = {
  [K in keyof T1 | keyof T2]: K extends keyof T2
    ? T2[K]
    : K extends keyof T1
      ? T1[K]
      : never;
};

//
// APPLY PREFIX
//

export type ApplyAppPrefix<TApp extends App> = App<
  ApplyAppDataPrefix<GetAppData<TApp>>
>;

export type ApplyAppDataPrefix<TAppData extends BaseAppData> =
  TAppData extends {
    base: BasePath;
    routes: BaseRoutes;
  }
    ? {
        [key in keyof Omit<TAppData, "base">]: key extends "routes"
          ? {
              [TMethod in keyof TAppData["routes"]]: Simplify<
                PrefixObjectKeys<TAppData["base"], TAppData["routes"][TMethod]>
              >;
            }
          : TAppData[key];
      }
    : TAppData;

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
> = GetRequestParamsInputFromDef<TRoutes[TMethod][TPath]>;

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
> = GetResponseInputFromDef<TRoutes[TMethod][TPath]>;

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
> = GetRequestParamsOutputFromDef<TRoutes[TMethod][TPath]>;

export type GetResponseOutputFromDef<TDef extends BaseDef> = TDef extends {
  response: infer TSchema extends StandardSchemaV1;
}
  ? StandardSchemaV1.InferOutput<TSchema>
  : void;

export type GetResponseOutput<
  TRoutes extends BaseRoutes,
  TMethod extends keyof TRoutes,
  TPath extends keyof TRoutes[TMethod],
> = GetResponseOutputFromDef<TRoutes[TMethod][TPath]>;

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

export type Fallback<T1, T2> = T1 extends undefined ? T2 : T1;

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
