import type { Transport } from "../types";

export type BunTransport = Transport<[request: Request, server: Bun.Server]>;

declare module "../types" {
  interface RequestContext {
    server: Bun.Server;
  }
}

export function createBunTransport(
  options?: Omit<Bun.ServeFunctionOptions<any, any>, "fetch" | "port">,
): BunTransport {
  const listen: BunTransport["listen"] = (port, fetch, cb) => {
    Bun.serve({ ...options, port, fetch });
    if (cb) setTimeout(cb, 0);
  };

  const decorate: BunTransport["decorate"] = (ctx, _request, server) => {
    ctx.server = server;
  };

  return {
    listen,
    decorate,
  };
}
