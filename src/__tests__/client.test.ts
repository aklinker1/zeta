import { describe, it, expect, mock } from "bun:test";
import { createApp } from "../app";
import { createTestAppClient } from "../testing";
import type { App } from "../types";
import type { GetClientRoutes } from "../client";
import { expectTypeOf } from "expect-type";
import { z } from "zod/v4";
import { HttpStatus } from "../status";
import { ErrorResponse, NoResponse } from "../custom-responses";

// Silence console.error logs
globalThis.console.error = mock();

describe("Client", () => {
  describe("inputs", () => {
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

    it("should require any params from the definition", async () => {
      const app = createApp().put(
        "/api/users/:id",
        {
          operationId: "updateUser",
          params: z.object({
            id: z.string(),
          }),
          body: z.object({
            name: z.string(),
          }),
        },
        () => {},
      );
      const client = createTestAppClient(app);

      await client.fetch("PUT", "/api/users/:id", {
        body: { name: "test" },
        params: { id: "123" },
      });
    });
  });

  describe("response types", () => {
    describe("single response", () => {
      it("should return the responses type", async () => {
        const app = createApp().get(
          "/health",
          { responses: z.object({ status: z.string() }) },
          () => ({ status: "ok" }),
        );
        const client = createTestAppClient(app);

        const response = await client.fetch("GET", "/health", {});
        expectTypeOf(response).toEqualTypeOf<{ status: string }>();
        expect(response).toEqual({ status: "ok" });
      });
    });

    describe("multiple responses", () => {
      it("should return a union of the 2XX responses", async () => {
        const app = createApp().put(
          "/users/:id",
          {
            params: z.object({ id: z.string() }),
            responses: {
              [200]: z.object({ id: z.string(), name: z.string() }),
              [HttpStatus.NoContent]: NoResponse,
              [HttpStatus.BadRequest]: ErrorResponse,
            },
          },
          ({ status }) => status(HttpStatus.NoContent, undefined),
        );
        const client = createTestAppClient(app);

        const response = await client.fetch("PUT", "/users/:id", {
          params: { id: "123" },
        });
        expectTypeOf(response).toEqualTypeOf<void | {
          id: string;
          name: string;
        }>();
        expect(response).toEqual(undefined);
      });
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
