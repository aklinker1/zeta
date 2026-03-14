import type { RequestContext, Transport } from "../types";
import { createApp } from "../app";

const SERVER_KEY = Symbol("bun-transport.server");

export type BunTransport = Transport<[request: Request, server: Bun.Server]>;

export function createBunTransport(
  options?: Omit<Bun.ServeFunctionOptions<any, any>, "fetch" | "port">,
): BunTransport {
  const listen: BunTransport["listen"] = (port, fetch, cb) => {
    Bun.serve({ ...options, port, fetch });
    if (cb) setTimeout(cb, 0);
  };

  const decorate: BunTransport["decorate"] = (ctx, _request, server) => {
    ctx[SERVER_KEY] = server;
  };

  return {
    listen,
    decorate,
  };
}

/**
 * Given the request context, return Bun's `server` object. Throws an error if the bun transport is not provided on the top-level app.
 *
 * @example
 * ```ts
 * const app = createApp({
 *   transport: createBunTransport(),
 * }).get("/", (ctx) => {
 *   const server = getBunServer(ctx);
 * })
 * ```
 *
 * @see `bunServerPlugin` to add the `server` object to request context directly.
 */
export function getBunServer(ctx: RequestContext): Bun.Server {
  const server = (ctx as any)[SERVER_KEY];
  if (!server)
    throw Error(
      "Bun server not found. Did you forget to provide the bun transport?",
    );

  return server;
}

/**
 * Plugin that decorates Bun's `server` object in the request context.
 *
 * @example
 * ```ts
 * const app = createApp({
 *   transport: createBunTransport(),
 * })
 *   .use(bunServerPlugin)
 *   .get("/", ({ server }) => {
 *     // ...
 *   })
 * ```
 *
 * @see `getBunServer` for a simple function to return the server
 */
export const bunServerPlugin = createApp()
  .onTransform((ctx) => ({ server: getBunServer(ctx) }))
  .export();
