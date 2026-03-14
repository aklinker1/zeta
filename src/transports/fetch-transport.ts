import type { Transport } from "../types";

export function createFetchTransport(): Transport {
  const listen: Transport["listen"] = (port, fetch, cb) => {
    if (globalThis.Bun) Bun.serve({ port, fetch });
    else if (globalThis.Deno) Deno.serve({ port }, fetch);
    else
      throw Error(`Cannot automatically detect which transport to use. You must specify a transport in your top-level app:

  ---
  import { createBunTransport } from '@aklinker1/zeta/transports/bun-transport';

  const app = createApp({
    transport: createBunTransport(),
  })

  app.listen();
  ---`);

    if (cb) setTimeout(cb, 0);
  };

  return {
    listen,
  };
}
