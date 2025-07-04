import type { StandardSchemaV1 } from "@standard-schema/spec";
import { HttpError, ValidationError } from "../errors";
import { Status } from "../status";
import type { App } from "../types";

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

export function smartSerialize(value: unknown):
  | {
      contentType: string;
      serialized: BodyInit;
    }
  | undefined {
  if (value == null) return undefined;

  if (value instanceof FormData) {
    return {
      contentType: "multipart/form-data",
      serialized: value,
    };
  }

  if (value instanceof Blob) {
    return {
      contentType: value.type,
      serialized: value,
    };
  }

  switch (typeof value) {
    case "number":
    case "boolean":
    case "bigint":
    case "string":
      return { contentType: "text/plain", serialized: String(value) };
    case "object":
      return {
        contentType: "application/json",
        serialized: JSON.stringify(value),
      };
  }

  throw Error(
    "Could not serialize object for request: " + JSON.stringify(value),
  );
}

export async function smartDeserialize(
  arg: Response | Request,
): Promise<unknown> {
  const contentType = arg.headers.get("content-type");
  if (contentType == null) return;

  // JSON
  if (contentType.startsWith("application/json")) {
    return await arg.json();
  }

  // Forms
  if (
    contentType.startsWith("application/x-www-form-urlencoded") ||
    contentType.startsWith("multipart/form-data")
  ) {
    return await arg.formData();
  }

  // Text
  if (contentType.startsWith("text/")) {
    return await arg.text();
  }

  // Binary
  if (contentType.startsWith("application/octet-stream")) {
    return await arg.arrayBuffer();
  }

  // Unknown
  throw Error(`Unknown content type: "${contentType}"`);
}

export function isApp(obj: unknown): obj is App<any> {
  return (obj as any)[Symbol.toStringTag] === "ZetaApp";
}

export function getUrlQuery(url: URL): Record<string, string> {
  const query: Record<string, string> = {};
  const params = url.searchParams;
  const entries = params.entries();

  for (const entry of entries) query[entry[0]] = entry[1];
  return query;
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
