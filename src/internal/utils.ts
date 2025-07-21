import type { StandardSchemaV1 } from "@standard-schema/spec";
import { HttpError, ValidationError } from "../errors";
import { Status } from "../status";
import type { App, LifeCycleHook, MaybePromise, RouterData } from "../types";
import type { MatchedRoute } from "rou3";

export function validateSchema<T>(
  schema: StandardSchemaV1<T, T>,
  input: unknown,
): T {
  let res = schema["~standard"].validate(input);
  if (res instanceof Promise) throw Error("Async validation not supported");

  if (res.issues) throw new ValidationError(input, res.issues);

  return res.value;
}

function createHttpSchemaValidator(status: Status, message: string) {
  return <T>(schema: StandardSchemaV1<T, T>, input: unknown): T => {
    try {
      return validateSchema<T>(schema, input);
    } catch (err) {
      if (err instanceof ValidationError) {
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
  Status.BadRequest,
  "Input validation failed",
);
export const validateOutputSchema = createHttpSchemaValidator(
  Status.UnprocessableEntity,
  "Output validation failed",
);

export function isApp(obj: unknown): obj is App<any> {
  return (obj as any)[Symbol.toStringTag] === "ZetaApp";
}

export function getRawQuery(url: URL): Record<string, string> {
  const query: Record<string, string> = {};
  const params = url.searchParams;
  const entries = params.entries();

  for (const entry of entries) query[entry[0]] = entry[1];
  return query;
}

export function getRawParams(
  route: MatchedRoute<RouterData>,
): Record<string, string> {
  const rawParams = route.params ?? {};
  // Rename _ to ** for validation and consistency
  if ("_" in rawParams) {
    rawParams["**"] = rawParams["_"];
    delete rawParams["_"];
  }
  return rawParams;
}

export function getErrorStack(err: Error): string[] | undefined {
  if (process.env.NODE_ENV === "production") return;
  return err.stack
    ?.split("\n")
    .map((line) => line.trim())
    .slice(1);
}

export type HttpErrorResponse = {
  [additionalInfo: string]: any;
  name: string;
  message: string;
  status: Status;
  stack?: string[];
  cause?: HttpErrorResponse;
};

export function serializeErrorResponse(err: unknown): HttpErrorResponse {
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
      status: Status.InternalServerError,
      name: err.name,
      message: err.message,
      stack: getErrorStack(err),
      cause: err.cause != null ? serializeErrorResponse(err.cause) : undefined,
    };

  return {
    name: "Unknown Error",
    message: "An unknown error occurred",
    status: Status.InternalServerError,
    stack: getErrorStack(err as Error),
  };
}

export async function callCtxModifierHooks(
  ctx: any,
  hooks: LifeCycleHook<
    (ctx: any) => MaybePromise<Record<string, any> | void>
  >[],
): Promise<Response | undefined> {
  for (const hook of hooks) {
    let res = hook.callback(ctx);
    res = res instanceof Promise ? await res : res;
    if (res instanceof Response) return res;
    if (res) Object.assign(ctx, res);
  }
}
