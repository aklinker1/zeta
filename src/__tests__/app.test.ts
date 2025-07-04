import { describe, it, expect } from "bun:test";
import { createApp } from "../app";
import { z } from "zod/v4";
import { createTestAppClient } from "../testing";

describe("App", () => {
  describe("fetch", () => {
    describe("response type inference", () => {
      it.each<{
        respondWith: any;
        expectedResponse: any;
        expectedContentType: string | null;
      }>([
        {
          respondWith: { hello: "world" },
          expectedResponse: { hello: "world" },
          expectedContentType: "application/json;charset=utf-8",
        },
        {
          respondWith: [1, 2, 3],
          expectedResponse: [1, 2, 3],
          expectedContentType: "application/json;charset=utf-8",
        },
        {
          respondWith: "test",
          expectedResponse: "test",
          expectedContentType: "text/plain",
        },
        {
          respondWith: true,
          expectedResponse: "true",
          expectedContentType: "text/plain",
        },
        {
          respondWith: 10,
          expectedResponse: "10",
          expectedContentType: "text/plain",
        },
        {
          respondWith: null,
          expectedResponse: undefined,
          expectedContentType: null,
        },
        {
          respondWith: undefined,
          expectedResponse: undefined,
          expectedContentType: null,
        },
      ])(
        "should respond with the correct content type and value for %j",
        async ({ respondWith, expectedResponse }) => {
          const app = createApp().get(
            "/test",
            { response: z.any() },
            () => respondWith,
          );
          const client = createTestAppClient(app);
          const response = await client.fetch("GET", "/test", {});

          expect(response).toEqual(expectedResponse);
        },
      );
    });

    describe("request body inference", () => {
      it.each<{
        input: any;
        expected: any;
      }>([
        {
          input: { a: "a" },
          expected: { a: "a" },
        },
        {
          input: "test",
          expected: "test",
        },
        {
          input: true,
          expected: "true",
        },
        {
          input: 1,
          expected: "1",
        },
      ])(
        "should parse the request body correctly for: %j",
        async ({ input, expected }) => {
          let actual: any;
          const app = createApp().post(
            "/test",
            { body: z.any() },
            ({ body }) => void (actual = body),
          );
          const client = createTestAppClient(app);

          await client.fetch("POST", "/test", {
            body: input,
          });

          expect(actual).toEqual(expected);
        },
      );
    });

    describe("query parameters parsing", () => {
      it.each<{
        input: Record<string, string>;
        expected: Record<string, any>;
      }>([
        {
          input: { a: "a" },
          expected: { a: "a" },
        },
        // {
        //   input: { a: ["a", "b"] },
        //   expected: { a: ["a", "b"] },
        // },
        // {
        //   input: { a: "a", b: "b" },
        //   expected: { a: "a", b: "b" },
        // },
      ])(
        "should parse the query parameters correctly for: %j",
        async ({ input, expected }) => {
          let actual: any;
          const app = createApp().get(
            "/test",
            {
              query: z.object({
                a: z.any().optional(),
                b: z.any().optional(),
              }),
            },
            ({ query }) => void (actual = query),
          );
          const client = createTestAppClient(app);

          await client.fetch("GET", `/test`, {
            query: input,
          });

          expect(actual).toEqual(expected);
        },
      );
    });
  });

  describe("use", () => {
    describe("app", () => {
      it("should nest sub-apps inside other apps", async () => {
        const expectedUsers: any[] = [];
        const expectedHealth = "ok";
        const expectedHtml = "Some html...";
        const usersApp = createApp({ prefix: "/users" }).get(
          "/",
          () => expectedUsers,
        );
        const apiApp = createApp({ prefix: "/api" })
          .use(usersApp)
          .get("/health", () => expectedHealth);
        const app = createApp()
          .use(apiApp)
          .get("/", () => expectedHtml);

        const usersClient = createTestAppClient(usersApp);
        const apiClient = createTestAppClient(apiApp);
        const client = createTestAppClient(app);

        const usersResArray = [
          await usersClient.fetch("GET", "/users", {}),
          await apiClient.fetch("GET", "/api/users", {}),
          await client.fetch("GET", "/api/users", {}),
        ];
        for (const usersRes of usersResArray) {
          expect(usersRes).toEqual(expectedUsers);
        }

        const healthResArray = [
          await apiClient.fetch("GET", "/api/health", {}),
          await client.fetch("GET", "/api/health", {}),
        ];
        for (const healthRes of healthResArray) {
          expect(healthRes).toBe(expectedHealth);
        }

        const htmlRes = await client.fetch("GET", "/", {});
        expect(htmlRes).toBe(expectedHtml);
      });
    });
  });
});
