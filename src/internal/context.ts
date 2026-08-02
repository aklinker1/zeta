import type { MatchedRoute } from "rou3";

import { createStore, type Store } from "../async-local-storage";
import { HttpStatus } from "../status";
import type { RouterData, StatusResult } from "../types";
import { getRawParams, getRawQuery, IsStatusResult } from "./utils";

export class Context {
  set = {
    status: HttpStatus.Ok,
    headers: {},
  };

  matchedRoute: MatchedRoute<RouterData> | undefined;

  // Private storage for overwritten values
  #params: Record<string, any> | undefined;
  #query: Record<string, any> | undefined;

  /**
   * AsyncLocalStorage store for per-request data.
   * Allows storing and accessing data anywhere in the call stack.
   */
  store: Store;

  /**
   * Internal Map used by AsyncLocalStorage.
   * @private
   */
  #storeMap: Map<string, any>;

  constructor(
    public request: Request,
    public path: string,
    public origin: string,
  ) {
    this.#storeMap = new Map();
    this.store = createStore(this.#storeMap);
  }

  /**
   * Get the internal Map for AsyncLocalStorage.
   * @private
   */
  getStoreMap(): Map<string, any> {
    return this.#storeMap;
  }

  get url(): URL {
    return new URL(this.request.url, this.origin);
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
    return this.request.url.includes("?") ? getRawQuery(this.request) : {};
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
