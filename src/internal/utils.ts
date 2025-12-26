import type { StandardSchemaV1 } from "@standard-schema/spec";
import { HttpError, ValidationGlobalError } from "../errors";
import { HttpStatus } from "../status";
import type {
  App,
  LifeCycleHook,
  MaybePromise,
  RouterData,
  StatusResult,
  Transport,
} from "../types";
import type { MatchedRoute } from "rou3";
import type { ErrorResponse } from "../schema";
import { createBunTransport } from "../transports/bun-transport";
import { createDenoTransport } from "../transports/deno-transport";

export function validateSchema<T>(
  schema: StandardSchemaV1<T, T>,
  input: unknown,
): T {
  let res = schema["~standard"].validate(input);
  if (res instanceof Promise) throw Error("Async validation not supported");

  if (res.issues) throw new ValidationGlobalError(input, res.issues);

  return res.value;
}

function createHttpSchemaValidator(status: HttpStatus, message: string) {
  return <T>(schema: StandardSchemaV1<T, T>, input: unknown): T => {
    try {
      return validateSchema<T>(schema, input);
    } catch (err) {
      if (err instanceof ValidationGlobalError) {
        throw new HttpError(status, message, {
          issues: err.issues,
          input: err.input,
        });
      } else {
        throw err;
      }
    }
  };
}

export const validateInputSchema = createHttpSchemaValidator(
  HttpStatus.BadRequest,
  "Input validation failed",
);
export const validateOutputSchema = createHttpSchemaValidator(
  HttpStatus.UnprocessableEntity,
  "Output validation failed",
);

export function isApp(obj: unknown): obj is App<any> {
  return (obj as any)[Symbol.toStringTag] === "ZetaApp";
}

export function getRawPathname(request: Request): string {
  // Fast path for common case: http://host/path
  const start = request.url.indexOf("/", 8); // Skip 'http://' or 'https://'
  if (start === -1) return "/";

  // Find end of pathname (before ? or #)
  for (let i = start + 1; i < request.url.length; i++) {
    const char = request.url[i];
    if (char === "?" || char === "#") {
      return request.url.slice(start, i);
    }
  }
  return request.url.slice(start);
}

export function getRawQuery(request: Request): Record<string, string> {
  let index = request.url.indexOf("?");
  if (index === -1) return {};

  const entries = request.url
    .slice(index + 1)
    .split("&")
    .map((entry) => entry.split("=", 2));
  const res: Record<string, string> = Object.create(null);
  for (const [key, value] of entries) {
    res[key] = value;
  }
  return res;
}

export function getRawParams(
  route: MatchedRoute<RouterData>,
): Record<string, string> {
  if (!route.params) return Object.create(null);

  const res: Record<string, string> = Object.create(null);
  for (const [key, value] of Object.entries(route.params)) {
    // Rename _ to ** to match type-system, rou3 uses _, Zeta uses _
    res[key === "_" ? "**" : key] = decodeURIComponent(value);
  }
  return res;
}

export function getErrorStack(err: Error): string[] | undefined {
  if (process.env.NODE_ENV === "production") return;
  return err.stack
    ?.split("\n")
    .map((line) => line.trim())
    .slice(1);
}

export function serializeErrorResponse(err: unknown): ErrorResponse {
  if (err instanceof HttpError)
    return {
      status: err.status,
      name: err.name,
      message: err.message,
      ...err.additionalInfo,
      stack: getErrorStack(err),
      cause: err.cause != null ? serializeErrorResponse(err.cause) : undefined,
    };

  if (err instanceof Error)
    return {
      status: HttpStatus.InternalServerError,
      name: err.name,
      message: err.message,
      stack: getErrorStack(err),
      cause: err.cause != null ? serializeErrorResponse(err.cause) : undefined,
    };

  return {
    name: "Unknown Error",
    message: "An unknown error occurred",
    status: HttpStatus.InternalServerError,
    stack: getErrorStack(err as Error),
  };
}

export async function callCtxModifierHooks(
  ctx: any,
  hooks:
    | LifeCycleHook<(ctx: any) => MaybePromise<Record<string, any> | void>>[]
    | undefined,
): Promise<Response | undefined> {
  if (!hooks) return;

  for (const hook of hooks) {
    let res = hook.callback(ctx);
    res = res instanceof Promise ? await res : res;
    if (res instanceof Response) return res;
    if (res) Object.assign(ctx, res);
  }
}

export const IsStatusResult = Symbol("IsStatusResult");

export function isStatusResult(result: any): result is StatusResult {
  return IsStatusResult in result;
}

export function detectTransport(): Transport {
  // @ts-ignore: Bun types may not be available
  if (typeof Bun !== "undefined") return createBunTransport();
  // @ts-ignore: Deno types may not be available
  if (typeof Deno !== "undefined") return createDenoTransport();

  throw Error(`Cannot automatically detect which transport to use. You must specify a transport in your top-level app:

    ---
    import { createBunTransport } from '@aklinker1/zeta/transports/bun-transport';

    const app = createApp({
      transport: createBunTransport(),
    })

    app.listen();
    ---`);
}
