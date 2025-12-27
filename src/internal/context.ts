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

  constructor(
    public request: Request,
    public path: string,
    public origin: string,
  ) {}

  get url(): URL {
    // TODO: Cache response
    return new URL(this.request.url, this.origin);
  }

  get params(): Record<string, string> {
    // TODO: Cache response
    return this.matchedRoute?.params ? getRawParams(this.matchedRoute) : {};
  }

  get query(): Record<string, string> {
    return this.request.url.includes("?") ? getRawQuery(this.request) : {};
  }

  get route(): string | undefined {
    return this.matchedRoute?.data.route;
  }

  get method(): string {
    return this.request.method;
  }

  // TODO: Add logic to call handler for returning this result
  status(status: number, body?: unknown): StatusResult {
    return {
      [IsStatusResult]: true,
      status,
      body,
    };
  }
}
