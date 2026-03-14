import { createApp } from "../app";
import type { App, RequestContext, Transport } from "../types";

const SERVER_KEY = Symbol("deno-transport.server");

export type DenoTransport = Transport<[request: Request, server: Deno.HttpServer]>;

type ServeOptions = Parameters<typeof Deno.serve>[0];

export function createDenoTransport(options?: Omit<ServeOptions, "port">): DenoTransport {
  const listen: DenoTransport["listen"] = (port, fetch, cb) => {
    Deno.serve({ ...options, port }, fetch);
    if (cb) setTimeout(cb, 0);
  };

  const decorate: DenoTransport["decorate"] = (ctx, _request, server) => {
    ctx[SERVER_KEY] = server;
  };

  return {
    listen,
    decorate,
  };
}

/**
 * Given the request context, return Deno's `server` object. Throws an error if the Deno transport is not provided on the top-level app.
 *
 * @example
 * ```ts
 * const app = createApp({
 *   transport: createDenoTransport(),
 * }).get("/", (ctx) => {
 *   const server = getDenoServer(ctx);
 * })
 * ```
 *
 * @see `denoServerPlugin` to add the `server` object to request context directly.
 */
export function getDenoServer(ctx: RequestContext): Deno.HttpServer {
  const server = (ctx as any)[SERVER_KEY];
  if (!server) throw Error("Deno server not found. Did you forget to provide the deno transport?");

  return server;
}

/**
 * Plugin that decorates Deno's `server` object in the request context.
 *
 * @example
 * ```ts
 * const app = createApp({
 *   transport: createDenoTransport(),
 * })
 *   .use(denoServerPlugin)
 *   .get("/", ({ server }) => {
 *     // ...
 *   })
 * ```
 *
 * @see `getDenoServer` for a simple function to return the server
 */
export const denoServerPlugin: App<{
  prefix: "";
  ctx: {
    server: Deno.HttpServer;
  };
  exported: true;
  routes: {};
  transport: DenoTransport;
}> = createApp()
  .onTransform((ctx) => ({ server: getDenoServer(ctx) }))
  .export();
