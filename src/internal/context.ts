import type { MatchedRoute } from "rou3";
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

  constructor(
    public request: Request,
    public path: string,
    public origin: string,
  ) {}

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
