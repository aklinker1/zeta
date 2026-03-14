import type { Transport } from "../types";

export type DenoTransport = Transport<
  [request: Request, server: Deno.HttpServer]
>;

declare module "../types" {
  interface RequestContext {
    // @ts-expect-error: Ignore conflict with bun transport, only one will be imported in production.
    server: Deno.HttpServer;
  }
}

export function createDenoTransport(
  options?: Omit<ServeOptions, "port">,
): DenoTransport {
  const listen: DenoTransport["listen"] = (port, fetch, cb) => {
    Deno.serve({ ...options, port }, fetch);
    if (cb) setTimeout(cb, 0);
  };

  const decorate: DenoTransport["decorate"] = (ctx, _request, server) => {
    ctx.server = server;
  };

  return {
    listen,
    decorate,
  };
}

type ServeOptions = Parameters<typeof Deno.serve>[0];
