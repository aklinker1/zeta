import type { MatchedRoute } from "rou3";

import { HttpStatus } from "../status";
import type { RouterData, Setter as SetterType, StatusResult } from "../types";
import { getRawParams, getRawQuery, IsStatusResult } from "./utils";

/**
 * `ctx.set`, with headers created lazily.
 *
 * Most responses never touch `set.headers`, and knowing that lets the compiled
 * route handler skip building a `ResponseInit` entirely, which is a large
 * fraction of the cost of returning a response.
 */
class Setter implements SetterType {
  status: number = HttpStatus.Ok;

  /**
   * The headers object, or `undefined` if nothing has read or written headers
   * yet. Compiled handlers read this instead of `headers` to avoid
   * materializing the object.
   */
  rawHeaders: Record<string, string> | undefined;

  get headers(): Record<string, string> {
    return (this.rawHeaders ??= {});
  }

  set headers(value: Record<string, string>) {
    this.rawHeaders = value;
  }
}

export class Context {
  set: SetterType = new Setter();

  matchedRoute: MatchedRoute<RouterData> | undefined;

  // Declared up-front so the compiled handlers assigning them don't force a
  // hidden class transition on every request.
  response: any;
  error: unknown;
  body: any;

  // Private storage for overwritten values
  #params: Record<string, any> | undefined;
  #query: Record<string, any> | undefined;

  constructor(
    public request: Request,
    public path: string,
    public origin: string,
    /** The unparsed `request.url`. Cached because it's a non-trivial getter. */
    public rawUrl: string,
  ) {}

  get url(): URL {
    return new URL(this.rawUrl, this.origin);
  }

  get params(): Record<string, any> {
    if (this.#params !== undefined) {
      return this.#params;
    }
    return this.matchedRoute?.params ? getRawParams(this.matchedRoute) : {};
  }

  set params(value: Record<string, any>) {
    this.#params = value;
  }

  get query(): Record<string, any> {
    if (this.#query !== undefined) {
      return this.#query;
    }
    return getRawQuery(this.rawUrl);
  }

  set query(value: Record<string, any>) {
    this.#query = value;
  }

  get route(): string | undefined {
    return this.matchedRoute?.data.route;
  }

  get method(): string {
    return this.request.method;
  }

  status(status: number, body?: unknown): StatusResult {
    return {
      [IsStatusResult]: true,
      status,
      body,
    };
  }
}
