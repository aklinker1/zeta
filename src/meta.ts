import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { SchemaAdapter } from "./types";
import type { ZetaSchema } from "./custom-responses";

/** Get metadata for either a ZetaSchema or a StandardSchemaV1. */
export function getMeta(
  adapter: SchemaAdapter | undefined,
  schema: StandardSchemaV1 | ZetaSchema,
): Record<string, any> {
  if ("~zeta" in schema) return schema.meta;

  if (!adapter) return {};
  return adapter.getMeta(schema) ?? {};
}
