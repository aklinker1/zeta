import { describe, it, expect } from "bun:test";
import { createApp } from "../app";
import { createTestAppClient } from "../testing";

describe("Client", () => {
  describe("params", () => {
    it("should make apply named path params", async () => {
      const id = "one";
      const expectedPath = `/api/users/${id}`;
      const expectedParams = { id };

      let actual: any;
      const app = createApp().get(
        "/api/users/:id",
        (ctx) => void (actual = ctx),
      );
      const client = createTestAppClient(app);

      await client.fetch("GET", "/api/users/:id", {
        params: { id },
      });

      expect(actual.path).toEqual(expectedPath);
      expect(actual.params).toEqual(expectedParams);
    });

    it("should make apply anonymous wildcard path params", async () => {
      const id = "one";
      const expectedPath = `/api/users/${id}`;
      const expectedParams = { "**": id };

      let actual: any;
      const app = createApp().get(
        "/api/users/**",
        (ctx) => void (actual = ctx),
      );
      const client = createTestAppClient(app);

      await client.fetch("GET", "/api/users/**", {
        params: { "**": id },
      });

      expect(actual.path).toEqual(expectedPath);
      expect(actual.params).toEqual(expectedParams);
    });

    it("should make apply named wildcard path params", async () => {
      const id = "one";
      const expectedPath = `/api/users/${id}`;
      const expectedParams = { id };

      let actual: any;
      const app = createApp().get(
        "/api/users/**:id",
        (ctx) => void (actual = ctx),
      );
      const client = createTestAppClient(app);
      await client.fetch("GET", "/api/users/**:id", {
        params: { id },
      });

      expect(actual.path).toEqual(expectedPath);
      expect(actual.params).toEqual(expectedParams);
    });
  });
});
