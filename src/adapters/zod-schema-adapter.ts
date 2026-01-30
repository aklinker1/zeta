/**
 * Contains a schema adapter for app's using [`zod`](https://npmjs.com/package/zod).
 * @module
 */
import { z } from "zod";
import type { SchemaAdapter } from "../types";

/**
 * Usage:
 *
 * ```ts
 * import { zodSchemaAdapter } from "@aklinker1/zeta/adapters/zod-schema-adapter";
 *
 * const app = createApp({
 *   schemaAdapter: zodSchemaAdapter,
 * });
 * ```
 */
export const zodSchemaAdapter: SchemaAdapter = {
  toJsonSchema: (schema) => {
    if (!("_zod" in schema)) throw Error("input schema is not a Zod schema");
    const res = z.toJSONSchema(schema, { target: "openapi-3.0" });
    delete res.$schema;
    return res;
  },
  getMeta: (schema: any) => {
    return z.globalRegistry.get(schema);
  },
};
