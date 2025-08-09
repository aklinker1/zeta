import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { Status } from "./status";

/**
 * A schema for a error response. Use when defining additional status codes that an operation might return with:
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
export const ErrorResponse = {
  "~standard": {
    vendor: "@aklinker/zeta",
    version: 1,
    validate: (value: unknown): StandardSchemaV1.Result<ErrorResponse> => {
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
  },
} satisfies StandardSchemaV1;

/**
 * The actual type an error response conforms to.
 */
export type ErrorResponse = {
  [additionalInfo: string]: any;
  name: string;
  message: string;
  status: Status;
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
