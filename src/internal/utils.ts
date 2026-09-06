import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { MatchedRoute } from "rou3";

import { HttpError } from "../errors";
import type { ErrorResponse } from "../schema";
import { HttpStatus } from "../status";
import type { RouterData } from "../types";

function validateSchema<T>(
  schema: StandardSchemaV1<T, T>,
  input: unknown,
  status: number,
  message: string,
): T {
  const res = schema["~standard"].validate(input);
  if (res instanceof Promise) throw Error("Async validation not supported");

  if (res.issues)
    throw new HttpError(status, message, {
      issues: res.issues,
      input: input,
    });

  return res.value;
}

function createHttpSchemaValidator(status: number, message: string) {
  return <T>(schema: StandardSchemaV1<T, T>, input: unknown): T =>
    validateSchema<T>(schema, input, status, message);
}

export const validateInputSchema = createHttpSchemaValidator(
  HttpStatus.BadRequest,
  "Input validation failed",
);
export const validateOutputSchema = createHttpSchemaValidator(
  HttpStatus.UnprocessableEntity,
  "Output validation failed",
);

// Character codes used while scanning URLs. Scanning by char code avoids
// allocating a single-character string for every character of the URL.
const CHAR_HASH = 35; // #
const CHAR_PERCENT = 37; // %
const CHAR_AMPERSAND = 38; // &
const CHAR_PLUS = 43; // +
const CHAR_EQUALS = 61; // =
const CHAR_QUESTION = 63; // ?

export function getRawPathname(url: string): string {
  // Fast path for common case: http://host/path
  const start = url.indexOf("/", 8); // Skip 'http://' or 'https://'
  if (start === -1) return "/";

  // Find end of pathname (before ? or #), noting whether it contains any
  // percent-escapes so decoding can be skipped for the (very common) case
  // where there's nothing to decode.
  const len = url.length;
  let escaped = false;
  let i = start;
  for (; i < len; i++) {
    const char = url.charCodeAt(i);
    if (char === CHAR_QUESTION || char === CHAR_HASH) break;
    if (char === CHAR_PERCENT) escaped = true;
  }

  const pathname = url.slice(start, i);
  return escaped ? decodeURIComponent(pathname) : pathname;
}

export function getRawQuery(url: string): Record<string, string> {
  const index = url.indexOf("?");
  if (index === -1) return {};

  const res: Record<string, string> = {};
  const len = url.length;
  let start = index + 1;
  let eq = -1;
  let escaped = false;

  // `i === len` acts as a trailing "&" so the last pair is flushed by the same
  // code path as the rest.
  for (let i = start; i <= len; i++) {
    const char = i === len ? CHAR_AMPERSAND : url.charCodeAt(i);
    if (char === CHAR_AMPERSAND) {
      if (eq !== -1) {
        const value = url.slice(eq + 1, i);
        res[url.slice(start, eq)] = escaped ? decodeUrlString(value) : value;
      }
      start = i + 1;
      eq = -1;
      escaped = false;
    } else if (char === CHAR_EQUALS) {
      if (eq === -1) eq = i;
    } else if (eq !== -1 && (char === CHAR_PERCENT || char === CHAR_PLUS)) {
      escaped = true;
    }
  }
  return res;
}

export function getRawParams(route: MatchedRoute<RouterData>): Record<string, string> {
  const params = route.params;
  if (!params) return {};

  const res: Record<string, string> = {};
  for (const key in params) {
    const value = params[key]!;
    // Rename rou3's _ to ** to match type-system
    res[key === "_" ? "**" : key] = value.indexOf("%") === -1 ? value : decodeURIComponent(value);
  }
  return res;
}

function getErrorStack(err: Error): string[] | undefined {
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

/**
 * Builds a `ResponseInit` that only sets `Content-Type`, in the cheapest form
 * the runtime accepts.
 *
 * Building a `ResponseInit` is a surprisingly large share of the cost of
 * responding - in Bun, `new Response(body, { headers: { "Content-Type": x } })`
 * takes about 2.5x as long as `new Response(body)`. A bare `Response` is a
 * valid `ResponseInit` (the spec reads `status`/`statusText`/`headers` off of
 * whatever object it's given) and is by far the fastest of the options, since
 * the runtime can copy the already-parsed header list instead of re-parsing an
 * object literal. Nothing is shared with the constructed response, so a single
 * template can be reused for every request.
 *
 * The template is probed once at startup and falls back to a plain object for
 * runtimes that don't handle it.
 */
function createContentTypeInit(contentType: string): ResponseInit {
  const template = new Response(null, { headers: { "Content-Type": contentType } });
  try {
    const probe = new Response(null, template);
    if (probe.status === 200 && probe.headers.get("Content-Type") === contentType) return template;
  } catch {
    // Fall through to the portable form.
  }
  return { headers: template.headers };
}

export const TEXT_RESPONSE_INIT: ResponseInit = createContentTypeInit("text/plain");
export const JSON_RESPONSE_INIT: ResponseInit = createContentTypeInit("application/json");

export const IsStatusResult = Symbol("IsStatusResult");

export function cleanupCompiledWhitespace(code: string): string {
  return (
    code
      // Remove lines only containing spaces
      .replace(/^ +$/gm, "")
      // Reduce multiple newlines to one
      .replace(/\n\n+/gm, "\n\n")
      // Remove blank lines after curly braces
      .replaceAll("{\n\n", "{\n")
  );
}

function decodeUrlString(text: string): string {
  return decodeURIComponent(text.replaceAll("+", " "));
}
