import { describe, it } from "bun:test";
import { expectTypeOf } from "expect-type";
import type * as t from "../types";
import { z } from "zod/v4";

describe("Types", () => {
  describe("MergeRoutes", () => {
    it("should return {} when both routes are empty", () => {
      type A = {};
      type B = {};
      type Expected = {};

      type Actual = t.MergeRoutes<A, B>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it("should return the first path when the second is empty", () => {
      type A = { GET: { "/a": {} } };
      type B = {};
      type Expected = A;

      type Actual = t.MergeRoutes<A, B>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it("should return the second context when the first is empty", () => {
      type A = {};
      type B = { GET: { "/b": {} } };
      type Expected = B;

      type Actual = t.MergeRoutes<A, B>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it("should merge the same method together", () => {
      type A = { GET: { "/a": {} } };
      type B = { GET: { "/b": {} } };
      type Expected = { GET: { "/a": {}; "/b": {} } };

      type Actual = t.MergeRoutes<A, B>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it("should keep separate different methods", () => {
      type A = { GET: { "/a": {} } };
      type B = { POST: { "/b": {} } };
      type Expected = { GET: { "/a": {} }; POST: { "/b": {} } };

      type Actual = t.MergeRoutes<A, B>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it("should override the method details when the second object contains the same route as the first", () => {
      type A = { POST: { "/a": { body: z.ZodLiteral<"A"> } } };
      type B = { POST: { "/a": { body: z.ZodLiteral<"B"> } } };
      type Expected = { POST: { "/a": { body: z.ZodLiteral<"B"> } } };

      type Actual = t.MergeRoutes<A, B>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });
  });

  describe("MergeAppData", () => {
    it("should merge two empty app data together", () => {
      type A = t.DefaultAppData;
      type B = t.DefaultAppData;
      type Expected = t.DefaultAppData;

      type Actual = t.MergeAppData<A, B>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it("should merge ctx into the first app data", () => {
      type A = {
        prefix: "";
        routes: {};
        exported: false;
        ctx: { a: "A" };
      };
      type B = {
        routes: { GET: { "/b": {} } };
      };
      type Expected = {
        prefix: A["prefix"];
        exported: A["exported"];
        ctx: { a: "A" };
        routes: { GET: { "/b": {} } };
      };

      type Actual = t.MergeAppData<A, B>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it("should merge all the properties together", () => {
      type A = {
        prefix: "/api";
        exported: false;
        ctx: { a: "A" };
        routes: { GET: { "/a": {} } };
      };
      type B = {
        prefix: "/test";
        exported: true;
        ctx: { b: "B" };
        routes: { GET: { "/b": {} } };
      };
      type Expected = {
        prefix: "/test";
        exported: true;
        ctx: { a: "A"; b: "B" };
        routes: { GET: { "/a": {}; "/b": {} } };
      };

      type Actual = t.MergeAppData<A, B>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });
  });

  describe("GetRequestParamsInputFromDef", () => {
    it("should get input type for all fields, ignoring response", () => {
      type Def = {
        query: z.ZodObject<{ asc: z.ZodCoercedBoolean<string> }>;
        params: z.ZodObject<{ id: z.ZodString }>;
        body: z.ZodObject<{ id: z.ZodString; user: z.ZodString }>;
        response: z.ZodArray<
          z.ZodObject<{ id: z.ZodString; user: z.ZodString }>
        >;
      };
      type Expected = {
        query: { asc: string };
        params: { id: string };
        body: { id: string; user: string };
      };

      type Actual = t.GetRequestParamsInputFromDef<Def>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it("should include only the body", () => {
      type Def = {
        body: z.ZodObject<{ id: z.ZodString; user: z.ZodString }>;
      };
      type Expected = {
        body: { id: string; user: string };
      };

      type Actual = t.GetRequestParamsInputFromDef<Def>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it("should include only the query", () => {
      type Def = {
        query: z.ZodObject<{ asc: z.ZodCoercedBoolean<string> }>;
      };
      type Expected = {
        query: { asc: string };
      };

      type Actual = t.GetRequestParamsInputFromDef<Def>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it("should include only the params", () => {
      type Def = {
        params: z.ZodObject<{ id: z.ZodString }>;
      };
      type Expected = {
        params: { id: string };
      };

      type Actual = t.GetRequestParamsInputFromDef<Def>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it("should return any when using AnyDef", () => {
      type Def = t.AnyDef;
      type Expected = {
        query?: Record<string, string>;
        params?: Record<string, string>;
        headers?: Record<string, string>;
        body?: any;
      };

      type Actual = t.GetRequestParamsInputFromDef<Def>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });
  });

  describe("GetRequestParamsOutputFromDef", () => {
    it("should return the output type at the given route", () => {
      type Def = {
        query: z.ZodObject<{ asc: z.ZodCoercedBoolean<string> }>;
        params: z.ZodObject<{ id: z.ZodCoercedNumber<string> }>;
        body: z.ZodObject<{ name: z.ZodString }>;
      };
      type Expected = {
        query: { asc: boolean };
        params: { id: number };
        body: { name: string };
      };

      type Actual = t.GetRequestParamsOutputFromDef<Def>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it("should return any when using AnyDef", () => {
      type Def = t.AnyDef;
      type Expected = {
        query: Record<string, string>;
        params: Record<string, string>;
        headers: Record<string, string>;
        body: any;
      };

      type Actual = t.GetRequestParamsOutputFromDef<Def>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });
  });

  describe("GetResponseInputFromDef", () => {
    it("should return void when there is no response", () => {
      type Def = {};
      type Expected = void;

      type Actual = t.GetResponseInputFromDef<Def>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it("should return the input type when provided", () => {
      type Def = {
        response: z.ZodObject<{ id: z.ZodString }>;
      };
      type Expected = { id: string };

      type Actual = t.GetResponseInputFromDef<Def>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it("should return any when using AnyDef", () => {
      type Def = t.AnyDef;
      type Expected = any;

      type Actual = t.GetResponseInputFromDef<Def>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });
  });

  describe("GetResponseOutputFromDef", () => {
    it("should return void when there is no response defined", () => {
      type Def = {};
      type Expected = void;

      type Actual = t.GetResponseOutputFromDef<Def>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it("should return the input response type", () => {
      type Def = {
        response: z.ZodObject<{ id: z.ZodString }>;
      };
      type Expected = { id: string };

      type Actual = t.GetResponseOutputFromDef<Def>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it("should return any when using AnyDef", () => {
      type Def = t.AnyDef;
      type Expected = any;

      type Actual = t.GetResponseOutputFromDef<Def>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });
  });

  describe("BuildHandlerContext", () => {
    it("should return any input params for AnyDef", () => {
      type Path = "/api";
      type Def = t.AnyDef;
      type App = {
        prefix: "";
        exported: false;
        ctx: {};
        routes: {
          GET: {
            [p in Path]: Def;
          };
        };
      };
      type Expected = {
        params: Record<string, string>;
        headers: Record<string, string>;
        query: Record<string, string>;
        body: any;
      };

      type Actual = t.BuildHandlerContext<App, Path, Def>;
      expectTypeOf<Actual>().toMatchObjectType<Expected>();
    });

    it("should include App.ctx values in the context", () => {
      type Path = "/api";
      type Def = t.AnyDef;
      type Ctx = { a: "A" };
      type App = {
        prefix: "";
        exported: false;
        ctx: Ctx;
        routes: {
          GET: {
            [p in Path]: Def;
          };
        };
      };
      type Expected = Ctx;

      type Actual = t.BuildHandlerContext<App, Path, Def>;
      expectTypeOf<Actual>().toMatchObjectType<Expected>();
    });

    it("should some base parameters for all handlers", () => {
      type Path = "/api";
      type Def = t.AnyDef;
      type Ctx = { a: "A" };
      type App = {
        prefix: "";
        exported: false;
        ctx: Ctx;
        routes: {
          GET: {
            [p in Path]: Def;
          };
        };
      };
      type Expected = {
        route: Path;
        request: Request;
      };

      type Actual = t.BuildHandlerContext<App, Path, Def>;
      expectTypeOf<Actual>().toMatchObjectType<Expected>();
    });
  });

  describe("ApplyAppPrefix", () => {
    it("should do nothing if the app doesn't have a prefix", () => {
      type MyApp = t.App<{
        prefix: "";
        exported: false;
        ctx: {};
        routes: {
          GET: { "/test": { body: z.ZodObject<{ id: z.ZodString }> } };
        };
      }>;
      type Expected = MyApp;

      type Actual = t.ApplyAppPrefix<MyApp>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it("should do nothing if the app doesn't have a prefix", () => {
      type MyApp = t.App<{
        prefix: "/api";
        ctx: {};
        exported: false;
        routes: {
          GET: { "/test": { body: z.ZodObject<{ id: z.ZodString }> } };
        };
      }>;
      type Expected = t.App<{
        prefix: "";
        ctx: {};
        exported: false;
        routes: {
          GET: { "/api/test": { body: z.ZodObject<{ id: z.ZodString }> } };
        };
      }>;

      type Actual = t.ApplyAppPrefix<MyApp>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });
  });

  describe("ApplyAppDataPrefix", () => {
    it("should move the app's prefix into each of the routes", () => {
      type AppData = {
        ctx: {
          a: "A";
        };
        exported: false;
        prefix: "/api";
        routes: {
          GET: {
            "/users": { body: z.ZodObject<{ id: z.ZodString }> };
            "/users/:id": { params: z.ZodObject<{ id: z.ZodString }> };
          };
          POST: {
            "/users": {
              body: z.ZodObject<{
                username: z.ZodString;
                password: z.ZodString;
              }>;
            };
          };
        };
      };
      type Expected = {
        ctx: AppData["ctx"];
        exported: false;
        prefix: "";
        routes: {
          GET: {
            "/api/users": AppData["routes"]["GET"]["/users"];
            "/api/users/:id": AppData["routes"]["GET"]["/users/:id"];
          };
          POST: {
            "/api/users": AppData["routes"]["POST"]["/users"];
          };
        };
      };

      type Actual = t.ApplyAppDataPrefix<AppData>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });
  });

  describe("UseAppData", () => {
    it("should not include ctx when child app is not exported", () => {
      type ParentAppData = {
        ctx: { a: "a" };
        exported: false;
        prefix: "/api";
        routes: {};
      };
      type ChildAppData = {
        ctx: { b: "b" };
        exported: false;
        prefix: "";
        routes: {
          GET: { "/users": t.AnyDef };
        };
      };
      type Expected = {
        ctx: { a: "a" };
        exported: false;
        prefix: "/api";
        routes: ChildAppData["routes"];
      };

      type Actual = t.UseAppData<ParentAppData, ChildAppData>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it("should include ctx when child app is exported", () => {
      type ParentAppData = {
        ctx: { a: "a" };
        exported: false;
        prefix: "/api";
        routes: {};
      };
      type ChildAppData = {
        ctx: { b: "b" };
        exported: true;
        prefix: "";
        routes: {
          GET: { "/users": t.AnyDef };
        };
      };
      type Expected = {
        ctx: { a: "a"; b: "b" };
        exported: false;
        prefix: "/api";
        routes: {
          GET: { "/users": t.AnyDef };
        };
      };

      type Actual = t.UseAppData<ParentAppData, ChildAppData>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });
  });
});
