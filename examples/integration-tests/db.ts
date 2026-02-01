import { Database } from "bun:sqlite";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

export async function openDb(
  filename = "data/integration-tests-app.db",
): Promise<Database> {
  if (filename !== ":memory:") {
    await mkdir(dirname(filename), { recursive: true });
  }

  const db = new Database(filename);

  db.run(`
    CREATE TABLE IF NOT EXISTS request_history (
      id TEXT PRIMARY KEY,
      start_time TEXT NOT NULL,
      path TEXT NOT NULL,
      method TEXT NOT NULL,
      status_code INTEGER NOT NULL
    )
  `);

  return db;
}
