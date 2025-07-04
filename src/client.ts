import type {
  BaseRoutes,
  Fallback,
  GetRequestParamsInput,
  GetResponseOutput,
  MaybePromise,
} from "./types";
import { smartDeserialize, smartSerialize } from "./internal/utils";
import type {
  GetAppRoutes,
  App,
  ApplyAppPrefix,
  ApplyAppDataPrefix,
} from "./types";
import { join } from "node:path/posix";

export interface AppClient<TRoutes extends BaseRoutes> {
  fetch<TMethod extends keyof TRoutes, TPath extends keyof TRoutes[TMethod]>(
    method: TMethod,
    path: TPath,
    inputs: GetRequestParamsInput<TRoutes, TMethod, TPath>,
  ): MaybePromise<GetResponseOutput<TRoutes, TMethod, TPath>>;
}

export function createAppClient<TApp extends App>(
  options?: CreateAppClientOptions,
): AppClient<GetClientRoutes<TApp>> {
  const {
    baseUrl = "/",
    fetch = globalThis.fetch,
    headers = {},
  } = options ?? {};

  return {
    async fetch(method, path, inputs: any) {
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
          );
        }

        return response as any;
      } catch (err) {
        throw Error("Fetch failed", { cause: err });
      }
    },
  };
}

export type GetClientRoutes<TApp> =
  TApp extends App<infer AppData>
    ? Fallback<ApplyAppDataPrefix<AppData>["routes"], {}>
    : never;

export class RequestError extends Error {
  constructor(
    message: string,
    public status: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "RequestError";
  }
}

export type GetAppClient<TApp extends App> = App extends { base: string }
  ? GetAppClient<ApplyAppPrefix<TApp>>
  : AppClient<
      GetAppRoutes<TApp> extends BaseRoutes ? GetAppRoutes<TApp> : never
    >;

export type CreateAppClientOptions = {
  fetch?: ClientSideFetch;
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

export type ClientSideFetch = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;
