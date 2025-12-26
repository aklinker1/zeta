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

  const res: Record<string, string> = {};
  const str = request.url;
  const len = str.length;
  let start = index + 1;

  for (let i = start; i < len; i++) {
    if (str[i] === "&" || i === len - 1) {
      const end = i === len - 1 ? len : i;
      const eqIndex = str.indexOf("=", start);
      if (eqIndex !== -1 && eqIndex < end) {
        res[str.slice(start, eqIndex)] = str.slice(eqIndex + 1, end);
      }
      start = i + 1;
    }
  }
  return res;
}

export function getRawParams(
  route: MatchedRoute<RouterData>,
): Record<string, string> {
  const params = route.params;
  if (!params) return {};

  const res: Record<string, string> = {};
  for (const key in params) {
    // Rename rou3's _ to ** to match type-system
    const outKey = key === "_" ? "**" : key;
    res[outKey] = decodeURIComponent(params[key]);
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
    if (res instanceof Promise) res = await res;
    if (res instanceof Response) return res;
    if (res) Object.assign(ctx, res); // TODO: Replace with manual property setting for performance?
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
