import { describe, expect, it } from "bun:test";

import { z } from "zod/v4";

import { zodSchemaAdapter } from "../adapters/zod-schema-adapter";
import { createApp } from "../app";
import { getStore } from "../async-local-storage";
import { createTestAppClient } from "../testing";

describe("AsyncLocalStorage", () => {
  describe("store in context", () => {
    it("should have a store object in the request context", async () => {
      let capturedStore: any = null;

      const app = createApp().get("/test", ({ store }) => {
        capturedStore = store;
        return "OK";
      });

      const client = createTestAppClient(app);
      await client.fetch("GET", "/test", {});

      expect(capturedStore).not.toBeNull();
      expect(capturedStore.get).toBeInstanceOf(Function);
      expect(capturedStore.set).toBeInstanceOf(Function);
      expect(capturedStore.has).toBeInstanceOf(Function);
      expect(capturedStore.delete).toBeInstanceOf(Function);
      expect(capturedStore.clear).toBeInstanceOf(Function);
    });

    it("should allow setting and getting values in the store", async () => {
      const app = createApp().get("/test", ({ store }) => {
        store.set("foo", "bar");
        store.set("number", 42);
        store.set("object", { nested: "value" });

        return {
          foo: store.get("foo"),
          number: store.get("number"),
          object: store.get("object"),
        };
      });

      const client = createTestAppClient(app);
      const response = await client.fetch("GET", "/test", {});

      expect(response).toEqual({
        foo: "bar",
        number: 42,
        object: { nested: "value" },
      });
    });

    it("should return undefined for non-existent keys", async () => {
      const app = createApp().get("/test", ({ store }) => {
        return {
          exists: store.has("nonexistent"),
          value: store.get("nonexistent"),
        };
      });

      const client = createTestAppClient(app);
      const response = await client.fetch("GET", "/test", {});

      expect(response).toEqual({
        exists: false,
        value: undefined,
      });
    });

    it("should support has() method", async () => {
      const app = createApp().get("/test", ({ store }) => {
        store.set("exists", "yes");

        return {
          exists: store.has("exists"),
          doesNotExist: store.has("nonexistent"),
        };
      });

      const client = createTestAppClient(app);
      const response = await client.fetch("GET", "/test", {});

      expect(response).toEqual({
        exists: true,
        doesNotExist: false,
      });
    });

    it("should support delete() method", async () => {
      const app = createApp().get("/test", ({ store }) => {
        store.set("toDelete", "value");
        const hadIt = store.has("toDelete");
        const deleted = store.delete("toDelete");
        const stillHasIt = store.has("toDelete");

        return {
          hadIt,
          deleted,
          stillHasIt,
        };
      });

      const client = createTestAppClient(app);
      const response = await client.fetch("GET", "/test", {});

      expect(response).toEqual({
        hadIt: true,
        deleted: true,
        stillHasIt: false,
      });
    });

    it("should support clear() method", async () => {
      const app = createApp().get("/test", ({ store }) => {
        store.set("key1", "value1");
        store.set("key2", "value2");
        store.set("key3", "value3");

        const beforeClear = [store.has("key1"), store.has("key2"), store.has("key3")];

        store.clear();

        const afterClear = [store.has("key1"), store.has("key2"), store.has("key3")];

        return {
          beforeClear,
          afterClear,
        };
      });

      const client = createTestAppClient(app);
      const response = await client.fetch("GET", "/test", {});

      expect(response).toEqual({
        beforeClear: [true, true, true],
        afterClear: [false, false, false],
      });
    });

    it("should support keys(), values(), and entries() methods", async () => {
      const app = createApp().get("/test", ({ store }) => {
        store.set("a", 1);
        store.set("b", 2);
        store.set("c", 3);

        return {
          keys: Array.from(store.keys()).sort(),
          values: Array.from(store.values()).sort(),
          entries: Array.from(store.entries()).sort(),
        };
      });

      const client = createTestAppClient(app);
      const response = await client.fetch("GET", "/test", {});

      expect(response).toEqual({
        keys: ["a", "b", "c"],
        values: [1, 2, 3],
        entries: [
          ["a", 1],
          ["b", 2],
          ["c", 3],
        ],
      });
    });
  });

  describe("getStore() helper function", () => {
    it("should allow accessing the store from nested functions", async () => {
      function helperFunction() {
        const store = getStore();
        return store.get("requestId");
      }

      const app = createApp()
        .onGlobalRequest(({ store }) => {
          store.set("requestId", "abc-123");
        })
        .get("/test", () => {
          const requestId = helperFunction();
          return { requestId };
        });

      const client = createTestAppClient(app);
      const response = await client.fetch("GET", "/test", {});

      expect(response).toEqual({
        requestId: "abc-123",
      });
    });

    it("should work across multiple nested function calls", async () => {
      function levelThree() {
        const store = getStore();
        return store.get("data");
      }

      function levelTwo() {
        return levelThree();
      }

      function levelOne() {
        return levelTwo();
      }

      const app = createApp().get("/test", ({ store }) => {
        store.set("data", "deep-value");
        return { result: levelOne() };
      });

      const client = createTestAppClient(app);
      const response = await client.fetch("GET", "/test", {});

      expect(response).toEqual({
        result: "deep-value",
      });
    });

    it("should throw an error when called outside of request context", () => {
      expect(() => getStore()).toThrow(
        "getStore() called outside of request context. Make sure you're calling this during request handling.",
      );
    });

    it("should be isolated per request", async () => {
      const results: string[] = [];

      const app = createApp()
        .onGlobalRequest(({ store }) => {
          // Simulate a unique request ID
          store.set("requestId", crypto.randomUUID());
        })
        .get("/test", ({ store }) => {
          const requestId = store.get("requestId");
          results.push(requestId);
          return { requestId };
        });

      const client = createTestAppClient(app);

      // Make multiple concurrent requests
      const responses = await Promise.all([
        client.fetch("GET", "/test", {}),
        client.fetch("GET", "/test", {}),
        client.fetch("GET", "/test", {}),
      ]);

      // All requests should have different IDs
      const requestIds = responses.map((r) => r.requestId);
      const uniqueIds = new Set(requestIds);
      expect(uniqueIds.size).toBe(3);

      // Each ID should appear exactly once
      expect(results.length).toBe(3);
      expect(new Set(results).size).toBe(3);
    });
  });

  describe("hooks integration", () => {
    it("should be accessible in onGlobalRequest hook", async () => {
      const app = createApp()
        .onGlobalRequest(({ store }) => {
          store.set("fromGlobalRequest", "global-value");
        })
        .get("/test", ({ store }) => {
          return { value: store.get("fromGlobalRequest") };
        });

      const client = createTestAppClient(app);
      const response = await client.fetch("GET", "/test", {});

      expect(response).toEqual({
        value: "global-value",
      });
    });

    it("should be accessible in onTransform hook", async () => {
      const app = createApp()
        .onTransform(({ store }) => {
          store.set("fromTransform", "transform-value");
        })
        .get("/test", ({ store }) => {
          return { value: store.get("fromTransform") };
        });

      const client = createTestAppClient(app);
      const response = await client.fetch("GET", "/test", {});

      expect(response).toEqual({
        value: "transform-value",
      });
    });

    it("should be accessible in onBeforeHandle hook", async () => {
      const app = createApp()
        .onBeforeHandle(({ store }) => {
          store.set("fromBeforeHandle", "before-value");
        })
        .get("/test", ({ store }) => {
          return { value: store.get("fromBeforeHandle") };
        });

      const client = createTestAppClient(app);
      const response = await client.fetch("GET", "/test", {});

      expect(response).toEqual({
        value: "before-value",
      });
    });

    it("should persist data across all hook stages", async () => {
      let allValues: any = {};

      const app = createApp()
        .onGlobalRequest(({ store }) => {
          store.set("stage1", "global-request");
        })
        .onTransform(({ store }) => {
          store.set("stage2", "transform");
        })
        .onBeforeHandle(({ store }) => {
          store.set("stage3", "before-handle");
        })
        .get("/test", ({ store }) => {
          allValues = {
            stage1: store.get("stage1"),
            stage2: store.get("stage2"),
            stage3: store.get("stage3"),
          };
          return allValues;
        });

      const client = createTestAppClient(app);
      const response = await client.fetch("GET", "/test", {});

      expect(response).toEqual({
        stage1: "global-request",
        stage2: "transform",
        stage3: "before-handle",
      });
    });
  });

  describe("use case: request logging", () => {
    it("should enable request ID tracking across the entire request lifecycle", async () => {
      const logs: string[] = [];

      function logWithRequestId(message: string) {
        const store = getStore();
        const requestId = store.get("requestId");
        logs.push(`[${requestId}] ${message}`);
      }

      const app = createApp({ schemaAdapter: zodSchemaAdapter })
        .onGlobalRequest(({ store }) => {
          const requestId = crypto.randomUUID();
          store.set("requestId", requestId);
          logWithRequestId("Request started");
        })
        .get(
          "/api/test",
          {
            query: z.object({ name: z.string().optional() }),
            responses: z.object({ success: z.boolean() }),
          },
          ({ query }) => {
            logWithRequestId(`Processing request for ${query.name ?? "anonymous"}`);
            return { success: true };
          },
        );

      const client = createTestAppClient(app);
      await client.fetch("GET", "/api/test", { query: { name: "John" } });

      expect(logs.length).toBe(2);
      expect(logs[0]).toMatch(/\[[\w-]+\] Request started/);
      expect(logs[1]).toMatch(/\[[\w-]+\] Processing request for John/);

      // Both logs should have the same request ID
      const requestId1 = logs[0].match(/\[([\w-]+)\]/)?.[1];
      const requestId2 = logs[1].match(/\[([\w-]+)\]/)?.[1];
      expect(requestId1).toBeDefined();
      expect(requestId2).toBeDefined();
      if (requestId1 && requestId2) {
        expect(requestId1).toBe(requestId2);
      }
    });
  });

  describe("use case: user context", () => {
    it("should enable storing authenticated user info for use throughout request", async () => {
      function getCurrentUser() {
        const store = getStore();
        return store.get("user");
      }

      const app = createApp()
        .onGlobalRequest(({ store, request }) => {
          // Simulate extracting user from auth header
          const authHeader = request.headers.get("Authorization");
          if (authHeader === "Bearer valid-token") {
            store.set("user", { id: 123, name: "John Doe" });
          }
        })
        .get("/api/profile", () => {
          const user = getCurrentUser();
          if (!user) {
            return { error: "Unauthorized" };
          }
          return { user };
        });

      const fetch = app.build();

      // Test without auth
      const res1 = await fetch(new Request("http://localhost/api/profile"));
      const response1 = await res1.json();
      expect(response1).toEqual({ error: "Unauthorized" });

      // Test with auth
      const res2 = await fetch(
        new Request("http://localhost/api/profile", {
          headers: { Authorization: "Bearer valid-token" },
        }),
      );
      const response2 = await res2.json();
      expect(response2).toEqual({
        user: { id: 123, name: "John Doe" },
      });
    });
  });
});
