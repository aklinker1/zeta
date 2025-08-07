/**
 * Contains a schema adapter for app's using [`zod`](https://npmjs.com/package/zod).
 * @module
 */
import type { SchemaAdapter } from "../types";

const zod = "zod/v4";
const { z } = await import(zod);

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
    const res = z.toJSONSchema(schema, { target: "draft-7" });
    delete res.$schema;
    return res;
  },
  parseParamsRecord: (params: any) => {
    if (params?._zod?.def?.type !== "object")
      throw Error(
        "Query, params, and header schemas must be simple Zode objects defined with z.object({ ... })",
      );

    return Object.entries(params._zod.def.shape).map(
      ([key, schema]: [string, any]) => ({
        name: key,
        schema,
        optional: schema.safeParse(undefined).success,
        ...z.globalRegistry.get(schema),
      }),
    );
  },
  getMeta: (schema: any) => {
    const meta = z.globalRegistry.get(schema);
    return meta?.contentType ?? meta?.["content-type"];
  },
};
