import { createApp } from "./src";
import { version } from "./package.json" with { type: "json" };
import { z } from "zod/v4";
import { NotFoundError } from "./src/errors";
import { zodSchemaAdapter } from "./src/adapters/zod-schema-adapter";

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
})
  .get("/api/health", { response: HealthResponse }, (_ctx) => ({
    status: "ok" as const,
    version,
  }))

  .get("/api/entries", { response: Entry.array() }, () => entries)

  // curl -X POST -H "Content-Type: application/json" -d '{"id":1,"text":"one"}' http://localhost:3000/api/entries
  .post("/api/entries", { body: Entry }, ({ body }) => {
    entries.push(body);
  })

  .get(
    "/api/entries/:id",
    { params: z.object({ id: z.coerce.number() }), response: Entry },
    ({ params }) => {
      const entry = entries.find((entry) => entry.id === params.id);
      if (!entry) throw new NotFoundError(undefined, { entryId: params.id });

      return entry;
    },
  );

console.log(
  `\x1b[2m[${new Date().toLocaleTimeString()}]\x1b[0m Example app started \x1b[2m@\x1b[0m \x1b[36mhttp://localhost:3000\x1b[0m`,
);

app.listen(3000);
