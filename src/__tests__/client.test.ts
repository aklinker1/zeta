import { describe, it, expect } from "bun:test";
import { createApp } from "../app";
import { createTestAppClient } from "../testing";
import type { App } from "../types";
import type { GetClientRoutes } from "../client";
import { expectTypeOf } from "expect-type";

describe("Client", () => {
  describe("params", () => {
    it("should apply named path params correctly", async () => {
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

    it("should apply anonymous wildcard path params correctly", async () => {
      const id = "one";
      const expectedPath = `/api/users/${id}`;
      const expectedParams = { "**": id };

      let actual: any;
      const app = createApp().get(
        "/api/users/**",
        (ctx) => void (actual = ctx),
      );
      await createTestAppClient(app).fetch("GET", "/api/users/**", {
        params: { "**": id },
      });

      expect(actual.path).toEqual(expectedPath);
      expect(actual.params).toEqual(expectedParams);
    });

    it("should apply named wildcard path params correctly", async () => {
      const id = "one";
      const expectedPath = `/api/users/${id}`;
      const expectedParams = { id };

      let actual: any;
      const app = createApp().get(
        "/api/users/**:id",
        (ctx) => void (actual = ctx),
      );
      await createTestAppClient(app).fetch("GET", "/api/users/**:id", {
        params: { id },
      });

      expect(actual.path).toEqual(expectedPath);
      expect(actual.params).toEqual(expectedParams);
    });
  });

  describe("GetClientRoutes", () => {
    it("should convert app data with prefix to absolute routes", () => {
      type MyApp = App<{
        ctx: {};
        prefix: "/api";
        exported: false;
        routes: {
          GET: {
            "/users": {};
            "/users/:id": {};
            "/images/:id": {};
          };
          POST: {
            "/images": {};
          };
        };
      }>;
      type Expected = {
        GET: {
          "/api/users": {};
          "/api/users/:id": {};
          "/api/images/:id": {};
        };
        POST: {
          "/api/images": {};
        };
      };

      type Actual = GetClientRoutes<MyApp>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });
  });
});
