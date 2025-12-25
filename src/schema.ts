import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { HttpStatus } from "./status";

export type ZetaSchema<Input = unknown, Output = Input> = StandardSchemaV1<
  Input,
  Output
> & {
  "~zeta": {
    type: string;
    meta: Record<string, any>;
  };
  toJsonSchema?(): any;
  meta(meta?: Record<string, any>): ZetaSchema<Input, Output>;
};

function createZetaSchema<Input = unknown, Output = Input>(
  name: string,
  validate: (value: unknown) => StandardSchemaV1.Result<Output>,
  toJsonSchema?: () => any,
  meta: Record<string, string> = {},
): ZetaSchema<Input, Output> {
  const parentMeta = meta;
  return {
    "~zeta": {
      type: name,
      meta,
    },
    "~standard": {
      vendor: "@aklinker/zeta",
      version: 1,
      validate,
    },
    meta(meta) {
      return createZetaSchema(name, validate, undefined, {
        ...parentMeta,
        ...meta,
      });
    },
    toJsonSchema,
  };
}

/**
 * A schema for an error response. Use when defining additional status codes
 * that an operation might return with:
 *
 * ```ts
 * import { ErrorResponse } from '@aklinker/zeta';
 *
 * app.get(
 *   "/api/item/:itemId",
 *   {
 *     responses: {
 *       200: Item.optional(),
 *       404: ErrorResponse,
 *     }
 *   },
 *   () => {
 *     // ...
 *   }
 * );
 * ```
 */
export const ErrorResponse: ZetaSchema<unknown, ErrorResponse> =
  createZetaSchema<unknown, ErrorResponse>(
    "ErrorResponse",
    (value: unknown): StandardSchemaV1.Result<ErrorResponse> => {
      if (value == null)
        return {
          issues: [{ message: `Expected an object, received ${value}` }],
        };

      if (typeof value !== "object")
        return {
          issues: [{ message: `Expected an object, received ${typeof value}` }],
        };

      const issues: StandardSchemaV1.Issue[] = [];
      if (typeof (value as any).name !== "string") {
        issues.push({
          message: `Expected a string, received ${typeof (value as any).name}`,
          path: ["name"],
        });
      }
      if (typeof (value as any).message !== "string") {
        issues.push({
          message: `Expected a string, received ${typeof (value as any).message}`,
          path: ["message"],
        });
      }
      if (typeof (value as any).status !== "number") {
        issues.push({
          message: `Expected a number, received ${typeof (value as any).status}`,
          path: ["status"],
        });
      }
      if (issues.length > 0) return { issues };

      return { value: value as ErrorResponse };
    },
  );

export function isZetaSchema(schema: any): schema is ZetaSchema {
  return schema?.["~standard"]?.vendor === "@aklinker/zeta";
}

/**
 * The actual type an error response conforms to.
 */
export type ErrorResponse = {
  [additionalInfo: string]: any;
  name: string;
  message: string;
  status: HttpStatus;
  stack?: string[];
  cause?: ErrorResponse;
};

export const ErrorResponseJsonSchema = {
  type: "object" as const,
  properties: {
    status: {
      type: "number" as const,
      description: "HTTP status code",
      example: 400,
    },
    name: {
      type: "string" as const,
      description: "The error's name",
      example: "Bad Request",
    },
    message: {
      type: "string" as const,
      description: "User-facing error message",
      example: "Property 'name' is required",
    },
  },
  required: ["status", "name", "message"],
};

/**
 * A schema for when you want to not return a response. Use when defining
 * additional status codes that an operation might return with:
 *
 * ```ts
 * import { NoResponse } from '@aklinker/zeta';
 *
 * app.get(
 *   "/api/item/:itemId",
 *   {
 *     responses: {
 *       [HttpStatus.Accepted]: NoResponse,
 *     }
 *   },
 *   () => {
 *     // ...
 *   }
 * );
 * ```
 */
export const NoResponse: ZetaSchema<undefined | null | void, void> =
  createZetaSchema<undefined | null | void, void>(
    "NoResponse",
    (value: unknown): StandardSchemaV1.Result<void> => {
      return value != null
        ? {
            issues: [
              { message: `Expected undefined or null, got ${typeof value}` },
            ],
          }
        : { value: undefined };
    },
  );

export const FormDataBody: ZetaSchema<FormData> = createZetaSchema<FormData>(
  "FormDataBody",
  (value: unknown): StandardSchemaV1.Result<FormData> => {
    return value instanceof FormData
      ? { value }
      : {
          issues: [{ message: `Expected FormData, got ${typeof value}` }],
        };
  },
  () => ({
    type: "object",
    additionalProperties: true,
  }),
  {
    contentType: "multipart/form-data",
  },
);

export const UploadFileBody: ZetaSchema<File> = createZetaSchema<File>(
  "UploadFileBody",
  (value: unknown): StandardSchemaV1.Result<File> => {
    if (!(value instanceof FormData)) {
      return {
        issues: [{ message: `Expected FormData, got ${typeof value}` }],
      };
    }

    const file = value.get("file");
    if (!(file instanceof File)) {
      return {
        issues: [{ message: `Expected File, got ${typeof file}` }],
      };
    }

    return { value: file };
  },
  () => ({
    type: "object",
    properties: {
      file: {
        type: "string",
        format: "binary",
      },
    },
  }),
  {
    contentType: "multipart/form-data",
  },
);

export const UploadFilesBody: ZetaSchema<FormData, File[]> = createZetaSchema<
  FormData,
  File[]
>(
  "UploadFilesBody",
  (value): StandardSchemaV1.Result<File[]> => {
    if (!(value instanceof FormData)) {
      return {
        issues: [{ message: `Expected FormData, got ${typeof value}` }],
      };
    }

    const files = value.getAll("files");
    if (!Array.isArray(files)) {
      return {
        issues: [{ message: `Expected array of Files, got ${typeof files}` }],
      };
    }

    const issues: string[] = [];
    for (const file of files) {
      if (!(file instanceof File)) {
        issues.push(`Expected File, got ${typeof file}`);
      }
    }
    if (issues.length > 0) {
      return { issues: issues.map((message) => ({ message })) };
    }

    return { value: files as File[] };
  },
  () => ({
    type: "object",
    properties: {
      files: {
        type: "array",
        items: {
          type: "string",
          format: "binary",
        },
      },
    },
  }),
  {
    contentType: "multipart/form-data",
  },
);
