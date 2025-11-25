import type { Transport } from "../types";

export function createDenoTransport(): Transport {
  const listen: Transport["listen"] = (port, fetch, cb) => {
    // @ts-ignore: Deno types may not be available
    Deno.serve({ port, fetch });
    if (cb) setTimeout(cb, 0);
  };

  return {
    listen,
  };
}
