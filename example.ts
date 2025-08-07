import { createApp } from "./src";
import { version } from "./package.json" with { type: "json" };
import { z } from "zod/v4";
import { NotFoundError } from "./src/errors";
import { zodSchemaAdapter } from "./src/adapters/zod-schema-adapter";
import { Status } from "./src/status";

const Entry = z.object({
  id: z.number(),
  text: z.string(),
});
type Entry = z.infer<typeof Entry>;

const HealthResponse = z.object({
  status: z.literal("ok"),
  version: z.string().default(version),
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
      response: HealthResponse,
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
      response: Entry.array(),
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
    },
    ({ body, set }) => {
      entries.push(body);
      set.status = Status.Accepted;
    },
  )

  .get(
    "/api/entries/:id",
    {
      operationId: "getEntryById",
      summary: "Get entry by ID",
      description: "Get an entry by ID",
      tags: ["Entries"],
      params: z.object({ id: z.coerce.number() }),
      response: Entry,
    },
    ({ params }) => {
      const entry = entries.find((entry) => entry.id === params.id);
      if (!entry) throw new NotFoundError(undefined, { entryId: params.id });

      return entry;
    },
  )

  .get(
    "/api/csv",
    {
      response: z.string().meta({ contentType: "text/csv" }),
    },
    () => "test",
  );

console.log(
  `\x1b[2m[${new Date().toLocaleTimeString()}]\x1b[0m Example app started \x1b[2m@\x1b[0m \x1b[36mhttp://localhost:3000\x1b[0m`,
);

app.listen(3000);
