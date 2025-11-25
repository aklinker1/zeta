import type { Transport } from "../types";
// @ts-ignore: Bun types may not be available
import type { ServeFunctionOptions } from "@types/bun";

export function createBunTransport(
  options: Omit<ServeFunctionOptions<any, any>, "fetch" | "port">,
): Transport {
  const listen: Transport["listen"] = (port, fetch, cb) => {
    // @ts-ignore: Bun types may not be available
    Bun.serve({ ...options, port, fetch });
    if (cb) setTimeout(cb, 0);
  };

  return {
    listen,
  };
}
