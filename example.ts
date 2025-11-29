import {
  createApp,
  ErrorResponse,
  NoResponse,
  HttpStatus,
  NotFoundHttpError,
} from "./src";
import { version } from "./package.json" with { type: "json" };
import { z } from "zod/v4";
import { zodSchemaAdapter } from "./src/adapters/zod-schema-adapter";

const EntryId = z.coerce.number().int().min(0).meta({ ref: "EntryId" });
type EntryId = z.infer<typeof EntryId>;

const Entry = z
  .object({
    id: EntryId,
    text: z.string(),
  })
  .meta({
    ref: "Entry",
  });
type Entry = z.infer<typeof Entry>;

const Version = z.string().default(version).meta({ ref: "Version" });

const HealthResponse = z
  .object({
    status: z.literal("ok"),
    version: Version,
  })
  .meta({
    ref: "HealthResponse",
  });
type HealthResponse = z.infer<typeof HealthResponse>;

const entries: Entry[] = [];

const app = createApp({
  schemaAdapter: zodSchemaAdapter,
  openApi: {
    info: {
      title: "Example API Reference",
      version,
      description: "API reference for the example application",
    },
    tags: [
      { name: "Entries", description: "Manage entries in the system" },
      { name: "System" },
    ],
  },
})
  .get(
    "/api/health",
    {
      operationId: "getHealth",
      summary: "Health check",
      description: "Check if the server is healthy",
      tags: ["System"],
      responses: HealthResponse,
    },
    ({ set }) => {
      set.headers.test = "test";
      return {
        status: "ok" as const,
        version,
      };
    },
  )
  .get(
    "/api/entries",
    {
      operationId: "listEntries",
      summary: "List all entries",
      description: "List all entries in the system",
      tags: ["Entries"],
      responses: Entry.array(),
    },
    () => entries,
  )
  // curl -X POST -H "Content-Type: application/json" -d '{"id":1,"text":"one"}' http://localhost:3000/api/entries
  .post(
    "/api/entries",
    {
      operationId: "createEntry",
      summary: "Create entry",
      description: "Create a new entry",
      tags: ["Entries"],
      body: Entry,
      responses: {
        [HttpStatus.Accepted]: NoResponse.meta({
          responseDescription: "Entry created",
        }),
      },
    },
    ({ body, status }) => {
      entries.push(body);
      return status(HttpStatus.Accepted, undefined);
    },
  )
  .get(
    "/api/entries/:id",
    {
      operationId: "getEntryById",
      summary: "Get entry by ID",
      description: "Get an entry by ID",
      tags: ["Entries"],
      params: z.object({ id: EntryId }),
      responses: {
        [HttpStatus.Ok]: Entry,
        [HttpStatus.NotFound]: ErrorResponse,
      },
    },
    ({ params, status }) => {
      const entry = entries.find((entry) => entry.id === params.id);
      if (!entry)
        throw new NotFoundHttpError(undefined, { entryId: params.id });

      return status(HttpStatus.Ok, entry);
    },
  )
  .delete(
    "/api/entries/:id",
    {
      operationId: "deleteEntry",
      summary: "Delete Entry",
      tags: ["Entries"],
      params: z.object({ id: EntryId }),
      responses: {
        [HttpStatus.NoContent]: NoResponse.meta({
          responseDescription: "Entry deleted",
        }),
      },
    },
    ({ status, params }) => {
      const index = entries.findIndex((entry) => entry.id === params.id);
      if (index >= 0) {
        entries.splice(index, 1);
      }
      return status(HttpStatus.NoContent, undefined);
    },
  )
  .get(
    "/api/csv",
    {
      summary: "Export CSV",
      tags: ["Entries"],
      responses: z.string().meta({ contentType: "text/csv" }),
    },
    () => "test",
  );

console.log(
  `\x1b[2m[${new Date().toLocaleTimeString()}]\x1b[0m Example app started \x1b[2m@\x1b[0m \x1b[36mhttp://localhost:3000\x1b[0m`,
);

app.listen(3000);
