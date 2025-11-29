import type { OpenAPI } from "openapi-types";
import type { App, BasePath, SchemaAdapter } from "./types";
import type { CreateAppOptions } from "./app";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import { getHttpStatusName } from "./status";
import { ErrorResponseJsonSchema, type ZetaSchema } from "./custom-responses";
import { getMeta } from "./meta";

export function buildOpenApiDocs(
  options: CreateAppOptions<any> | undefined,
  app: App,
): { type: "success"; spec: any } | { type: "error"; error: unknown } {
  try {
    if (!options?.schemaAdapter)
      return { type: "error", error: "OpenAPI docs require a schema adapter" };
    const adapter = options.schemaAdapter;

    const userDoc = options.openApi ?? {};
    const docs: OpenAPI.Document = {
      openapi: "3.1.0",
      ...userDoc,
      info: {
        title: "Zeta Application",
        version: "1.0.0",
        ...userDoc.info,
      },
      paths: {},
      components: {
        ...userDoc.components,
        schemas: {
          ...userDoc.components?.schemas,
          ErrorResponse: ErrorResponseJsonSchema,
        },
      },
    };
    for (const [method, methodEntry] of Object.entries(app["~zeta"].routes)) {
      for (const [path, routerData] of Object.entries(methodEntry)) {
        const openApiPath = path
          // Replace parameters with OpenAPI format
          .replace(/\/:([^/]+)/g, "/{$1}")
          // Remove trailing slash
          .replace(/\/$/, "");
        const { headers, params, query, body, responses, ...openApiOperation } =
          routerData.def ?? {};
        docs.paths ??= {};
        docs.paths[openApiPath] ??= {};

        (docs.paths[openApiPath] as any)[method.toLowerCase()] = {
          ...openApiOperation,
          requestBody: body
            ? {
                content: {
                  [getMeta(adapter, body)?.contentType ?? "application/json"]: {
                    schema: adapter.toJsonSchema(body),
                  },
                },
              }
            : undefined,
          parameters: [
            ...mapParameters(adapter, params, "path"),
            ...mapParameters(adapter, query, "query"),
            ...mapParameters(adapter, headers, "header"),
          ] as OpenAPI.Parameters,
          responses: {
            ...(!responses
              ? {}
              : "~standard" in responses
                ? {
                    200: buildResponse(200, responses, adapter),
                  }
                : Object.fromEntries(
                    Object.entries(responses).map(([status, response]) => [
                      status,
                      buildResponse(Number(status), response, adapter),
                    ]),
                  )),
            ...((params || query || headers || body) && {
              400: {
                description: "Bad Request",
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/ErrorResponse",
                    },
                  },
                },
              },
            }),
          },
        } as OpenAPI.Operation;
      }
    }

    return { type: "success", spec: optimizeSpec(docs) };
  } catch (error) {
    return { type: "error", error };
  }
}

export function buildScalarHtml(
  jsonRoute: BasePath,
  options: CreateAppOptions<any> | undefined,
): string {
  const scalarConfig = {
    // Aaron's preferences
    defaultOpenAllTags: true,

    // User options
    ...options?.scalar,

    // Required config
    url: jsonRoute,
  };
  return `<!doctype html>
<html>
  <head>
    <title>API Reference</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <div id="app"></div>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
    <script>
      const config = ${JSON.stringify(scalarConfig)};
      if (${process.env.NODE_ENV !== "production"}) {
        config.servers ??= [];
        config.servers.unshift({ url: location.origin })
      }
      Scalar.createApiReference('#app', config)
    </script>
  </body>
</html>
`;
}

function mapParameters(
  adapter: SchemaAdapter,
  schema: StandardSchemaV1 | undefined,
  _in: "query" | "path" | "header",
): OpenAPI.Parameters {
  if (!schema) return [];

  return adapter
    .parseParamsRecord(schema)
    .map(({ schema, optional, ...param }) => ({
      ...param,
      in: _in,
      schema: adapter.toJsonSchema(schema),
      required: !optional,
    }));
}

function buildResponse(
  status: number,
  schema: StandardSchemaV1 | ZetaSchema,
  adapter: SchemaAdapter,
): NonNullable<OpenAPI.Operation["responses"]>[string] {
  const meta = getMeta(adapter, schema);

  if ("~zeta" in schema) {
    const description =
      meta?.responseDescription ?? getHttpStatusName(status) ?? "";

    if (schema["~zeta"].type === "NoResponse") {
      return {
        description,
      };
    }

    if (schema["~zeta"].type === "ErrorResponse") {
      return {
        description,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      };
    }
  }

  return {
    description: meta?.responseDescription ?? getHttpStatusName(status),
    content: {
      [meta?.contentType ?? "application/json"]: {
        schema: adapter.toJsonSchema(schema),
      },
    },
  };
}

function optimizeSpec(spec: OpenAPI.Document): OpenAPI.Document {
  const optimized = structuredClone(spec);

  // Optimizations
  addModelRefs(optimized);
  sortComponentSchemas(optimized);

  return optimized;
}

/**
 * Look for `ref` properties from schema metadata and move those models to
 * `components.schemas`.
 */
function addModelRefs(spec: any): void {
  const recurse = (obj: any): void => {
    if (obj == null) return;
    if (typeof obj !== "object") return;

    // Recursively update array items
    if (Array.isArray(obj)) {
      for (let i = 0, il = obj.length; i < il; i++) recurse(obj[i]);
      return;
    }

    // Recursively update object properties
    const values = Object.values(obj);
    for (let i = 0, il = values.length; i < il; i++) recurse(values[i]);

    // Move model if it includes a ref
    if (typeof obj.ref === "string") {
      const ref = obj.ref;
      spec.components ??= {};
      spec.components.schemas ??= {};
      spec.components.schemas[ref] = {
        ...structuredClone(obj),
        // Remove any zeta-only properties OpenAPI doesn't support
        ref: undefined,
      };
      for (const key of Object.keys(obj)) delete obj[key];
      obj.$ref = `#/components/schemas/${ref}`;
    }
  };

  // Process the "paths" object
  recurse(spec.paths);
}

function sortComponentSchemas(spec: any): void {
  if (!spec?.components?.schemas) return;

  spec.components.schemas = Object.fromEntries(
    Object.entries(spec.components.schemas).sort((a, b) =>
      a[0].toLowerCase().localeCompare(b[0].toLowerCase()),
    ),
  );
}
