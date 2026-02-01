import { beforeEach, describe, expect, it, mock } from "bun:test";
import { HttpStatus } from "../../src";
import { openDb } from "./db";

// Mock any external dependencies
mock.module("./dependencies", async () => {
  // In this case, use a real SQLite instance, but keep it in-memory
  const db = await openDb(":memory:");

  return { db };
});

describe("App", async () => {
  // With bun:test, modules that depend on mocked modules or the mocked modules
  // themselves must be dynamically imported after the call to `mock.module`.
  const { app } = await import("./app");
  const { db } = await import("./dependencies");

  const fetch = app.build();

  beforeEach(() => {
    // Reset the DB before each test
    db.run("DELETE FROM request_history");
  });

  it("should track all requests in SQLite", async () => {
    const url1 = new URL("http://localhost/one");
    const url2 = new URL("http://localhost/two");
    const url3 = new URL("http://localhost/three");

    // Make the fetch requests
    await fetch(new Request(url1));
    await fetch(new Request(url2));
    await fetch(new Request(url3));

    // Wait for onGlobalAfterResponse timeouts to be fired
    await Bun.sleep(1);

    const history = db
      .query("SELECT method, path, status_code FROM request_history")
      .all();

    expect(history).toHaveLength(3);
    expect(history).toContainEqual({
      method: "GET",
      path: "/one",
      status_code: HttpStatus.Ok,
    });
    expect(history).toContainEqual({
      method: "GET",
      path: "/two",
      status_code: HttpStatus.Ok,
    });
    expect(history).toContainEqual({
      method: "GET",
      path: "/three",
      status_code: HttpStatus.NotFound,
    });
  });
});
