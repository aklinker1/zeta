/**
 * Main module used client-side in the same application. If you're frontend and
 * backend are in separate projects, generate your client using the OpenAPI docs.
 * @module
 */
import type {
  BaseRoutes,
  GetRequestParamsInput,
  GetResponseOutput,
} from "./types";
import type { HttpErrorResponse } from "./internal/utils";
import { smartDeserialize, smartSerialize } from "./internal/serialization";
import type {
  GetAppRoutes,
  App,
  ApplyAppPrefix,
  ApplyAppDataPrefix,
} from "./types";

/**
 * Type-safe client based on routes defined server-side.
 */
export interface AppClient<TRoutes extends BaseRoutes> {
  fetch<TMethod extends keyof TRoutes, TRoute extends keyof TRoutes[TMethod]>(
    method: TMethod,
    route: TRoute,
    inputs: GetRequestParamsInput<TRoutes, TMethod, TRoute>,
  ): Promise<GetResponseOutput<TRoutes, TMethod, TRoute>>;
  fetch<TRoute extends keyof TRoutes["ANY"]>(
    method: string,
    route: TRoute,
    inputs: GetRequestParamsInput<TRoutes, "ANY", TRoute>,
  ): Promise<GetResponseOutput<TRoutes, "ANY", TRoute>>;
}

/**
 * Creates a type-safe client based on the server-side app. This is only useful
 * if your frontend is in the same TypeScript project as your backend, and you
 * can reference it's types in the frontend.
 *
 * If that's not the case, generate your client using the OpenAPI docs.
 *
 * @example
 * ```ts
 * // Server-side:
 * import { createApp } from "@aklinker1/zeta";
 *
 * const app = createApp();
 * export type App = typeof app;
 *
 * // Client-side:
 * import type { App } from "../server";
 * //     ^^^^ MAKE SURE TO ONLY IMPORT THE TYPE HERE
 *
 * const client = createAppClient<App>();
 * ```
 */
export function createAppClient<TApp extends App>(
  options?: CreateAppClientOptions,
): AppClient<GetClientRoutes<TApp>> {
  const {
    baseUrl = location.origin,
    fetch = globalThis.fetch,
    headers = {},
  } = options ?? {};

  const buildSearchParams = (query: Record<string, unknown>) => {
    return new URLSearchParams(
      Object.entries(query)
        .filter(([, value]) => value != null)
        .map(([key, value]) => [key, String(value)]),
    ).toString();
  };

  const buildPath = (route: string, params: Record<string, unknown>) => {
    return Object.entries(params).reduce(
      (path, [key, value]) =>
        path.replace(
          key === "**" ? key : new RegExp(`\\*{2}:${key}|:${key}`),
          encodeURIComponent(String(value)),
        ),
      route,
    );
  };

  return {
    async fetch(method: string, route: string, inputs: any) {
      const searchParams =
        inputs.query == null
          ? ""
          : `?${buildSearchParams(inputs.query).toString()}`;
      const path =
        inputs.params == null ? route : buildPath(route, inputs.params);
      const url = `${join(baseUrl, path)}${searchParams}`;

      const init = {
        body: undefined as BodyInit | undefined,
        method: (method as string).toUpperCase(),
        headers: { ...headers } as Record<string, string>,
      } satisfies RequestInit;

      const body =
        inputs.body == null ? undefined : smartSerialize(inputs.body);
      if (body) {
        init.body = body.serialized;
        init.headers["Content-Type"] = body.contentType;
      }

      try {
        const res = await fetch(url, init);
        const response = await smartDeserialize(res);
        if (!res.ok) {
          throw new RequestError(
            (response as any)?.message ?? "Unknown error",
            res.status,
            response as HttpErrorResponse,
          );
        }
        return response as any;
      } catch (err) {
        throw Error("Fetch failed", { cause: err });
      }
    },
  };
}

/**
 * Helper for converting an `App` to the routes it exposes.
 */
export type GetClientRoutes<TApp> =
  TApp extends App<infer AppData>
    ? ApplyAppDataPrefix<AppData>["routes"]
    : never;

/**
 * Thrown by the client when the response is not OK. When an `HttpError` is
 * thrown server-side, this is the error throw client-side.
 */
export class RequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public response: HttpErrorResponse,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "RequestError";
  }
}

/**
 * Helper for converting an `App` type to `AppClient`.
 */
export type GetAppClient<TApp extends App> = App extends { prefix: string }
  ? GetAppClient<ApplyAppPrefix<TApp>>
  : AppClient<
      GetAppRoutes<TApp> extends BaseRoutes ? GetAppRoutes<TApp> : never
    >;

/**
 * Configure the client's behavior.
 */
export type CreateAppClientOptions = {
  fetch?: typeof fetch;
  /**
   * Base URL used when making requests.
   * @default location.origin
   */
  baseUrl?: string;
  /**
   * List of headers to send on every request.
   * @default {}
   */
  headers?: Record<string, string>;
};

/** Join string together using `/` without double slashes. */
function join(...paths: string[]) {
  return paths
    .map((path) => path.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");
}
