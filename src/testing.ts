/**
 * Utilities for testing your server-side application.
 *
 * You don't need to use these utils, you can call the app's `fetch` function directly.
 *
 * ```ts
 * const app = createApp()
 *   .get("/example", () => "Hello, world!")
 * const fetch = app.build();
 *
 * const res = await fetch("http://test/example");
 * expect(res.status).toEqual(200);
 * expect(await res.text()).toEqual("Hello, world!");
 * ```
 *
 * If you just care about the response body or error thrown, you can use the `createTestAppClient`.
 *
 * @see {@link createTestAppClient}
 * @module
 */
import {
  createAppClient,
  type AppClient,
  type CreateAppClientOptions,
  type GetClientRoutes,
} from "./client";
import type { App } from "./types";

/**
 * Create a client for testing your server-side application. When `fetch` is
 * called, the app's `fetch` function is called instead of using the global
 * `fetch`.
 *
 * @example
 * ```ts
 * const app = createApp()
 *   .get("/example", () => "Hello, world!")
 *
 * const client = createTestAppClient(app);
 *
 * expect(await client.get("/example")).toEqual("Hello, world!");
 * ```
 *
 * @param app
 * @param options
 * @returns An app client used to test your server-side application.
 */
export function createTestAppClient<TApp extends App>(
  app: TApp,
  options?: Omit<CreateAppClientOptions, "fetch">,
): AppClient<GetClientRoutes<TApp>> {
  const { baseUrl = "http://localhost" } = options ?? {};

  const fetch = app.build();

  return createAppClient({
    baseUrl,
    ...options,
    // @ts-expect-error: Fetch type varies between environments
    fetch: (...args) => fetch(new Request(...args)),
  });
}
