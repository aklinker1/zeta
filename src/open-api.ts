import type { OpenAPI } from "openapi-types";
import type { App, BasePath, SchemaAdapter } from "./types";
import type { CreateAppOptions } from "./app";
import type { StandardSchemaV1 } from "@standard-schema/spec";

export function buildOpenApiDocs(
  options: CreateAppOptions<any> | undefined,
  app: App,
): { type: "success"; docs: any } | { type: "error"; error: unknown } {
  try {
    if (!options?.schemaAdapter)
      throw Error("OpenAPI docs require a schema adapter");
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
          ErrorResponse: {
            type: "object",
            properties: {
              status: {
                type: "number",
                description: "HTTP status code",
                example: 400,
              },
              name: {
                type: "string",
                description: "The error's name",
                example: "Bad Request",
              },
              message: {
                type: "string",
                description: "User-facing error message",
                example: "Property 'name' is required",
              },
            },
            required: ["status", "name", "message"],
          },
        },
      },
    };
    for (const [method, methodEntry] of Object.entries(app["~zeta"].routes)) {
      for (const [path, routerData] of Object.entries(methodEntry)) {
        const openApiPath = path.replace(/\/:([^/]+)/g, "/{$1}");
        const { headers, params, query, body, response, ...openApiOperation } =
          routerData.def ?? {};
        docs.paths ??= {};
        docs.paths[openApiPath] ??= {};
        (docs.paths[openApiPath] as any)[method.toLowerCase()] = {
          ...openApiOperation,
          requestBody: body
            ? {
                content: {
                  [adapter.getResponseContentType(body) ?? "application/json"]:
                    {
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
            ...(response && {
              200: {
                description: "OK",
                content: {
                  [adapter.getResponseContentType(response) ??
                  "application/json"]: {
                    schema: adapter.toJsonSchema(response),
                  },
                },
              },
            }),
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
    return { type: "success", docs };
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
