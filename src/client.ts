/**
 * Main module used client-side in the same application. If you're frontend and
 * backend are in separate projects, generate your client using the OpenAPI docs.
 * @module
 */

import type {
  BaseRoutes,
  Fallback,
  GetRequestParamsInput,
  GetResponseOutput,
  MaybePromise,
} from "./types";
import {
  smartDeserialize,
  smartSerialize,
  type HttpErrorResponse,
} from "./internal/utils";
import type {
  GetAppRoutes,
  App,
  ApplyAppPrefix,
  ApplyAppDataPrefix,
} from "./types";
import { join } from "node:path/posix";

/**
 * Type-safe client based on routes defined server-side.
 */
export interface AppClient<TRoutes extends BaseRoutes> {
  fetch<TMethod extends keyof TRoutes, TPath extends keyof TRoutes[TMethod]>(
    method: TMethod,
    path: TPath,
    inputs: GetRequestParamsInput<TRoutes, TMethod, TPath>,
  ): MaybePromise<GetResponseOutput<TRoutes, TMethod, TPath>>;
  fetch<TPath extends keyof TRoutes["ANY"]>(
    method: string,
    path: TPath,
    inputs: GetRequestParamsInput<TRoutes, "ANY", TPath>,
  ): MaybePromise<GetResponseOutput<TRoutes, "ANY", TPath>>;
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
    baseUrl = "/",
    fetch = globalThis.fetch,
    headers = {},
  } = options ?? {};

  return {
    async fetch(method: string, path: string, inputs: any) {
      const searchParams =
        inputs.query == null
          ? undefined
          : new URLSearchParams(inputs.query).toString();
      const url = `${join(baseUrl, path as string)}${searchParams ? "?" + searchParams : ""}`;

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
    ? Fallback<ApplyAppDataPrefix<AppData>["routes"], {}>
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
export type GetAppClient<TApp extends App> = App extends { base: string }
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
   * @default "/"
   */
  baseUrl?: string;
  /**
   * List of headers to send on every request.
   * @default {}
   */
  headers?: Record<string, string>;
};
