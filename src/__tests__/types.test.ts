import { describe, it } from "bun:test";
import { expectTypeOf } from "expect-type";
import type * as t from "../types";
import { z } from "zod/v4";

describe("Types", () => {
  describe("SpreadObjects", () => {
    it("should merge two objects together", () => {
      type A = { a: "A" };
      type B = { b: "B" };
      type Expected = { a: "A"; b: "B" };

      type Actual = t.ShallowMergeObjects<A, B>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it("should use the second object's value when the key's conflict", () => {
      type A = { a: "A" };
      type B = { a: "B" };
      type Expected = { a: "B" };

      type Actual = t.ShallowMergeObjects<A, B>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });
  });

  describe("Fallback", () => {
    it("should return the fallback type when the first type is undefined", () => {
      expectTypeOf<t.Fallback<undefined, boolean>>().toEqualTypeOf<boolean>();
      expectTypeOf<t.Fallback<undefined, {}>>().toEqualTypeOf<{}>();
      expectTypeOf<t.Fallback<undefined, string>>().toEqualTypeOf<string>();
    });

    it("should return the original type when it is not undefined", () => {
      expectTypeOf<t.Fallback<boolean, never>>().toEqualTypeOf<boolean>();
      expectTypeOf<t.Fallback<{}, never>>().toEqualTypeOf<{}>();
      expectTypeOf<t.Fallback<number, never>>().toEqualTypeOf<number>();
      expectTypeOf<t.Fallback<null, never>>().toEqualTypeOf<null>();
    });
  });

  describe("MergeCtx", () => {
    it("should return undefined when both contexts are undefined", () => {
      type A = undefined;
      type B = undefined;
      type Expected = undefined;

      type Actual = t.MergeCtx<A, B>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it("should return the first context when the second is undefined", () => {
      type A = { a: "A" };
      type B = undefined;
      type Expected = A;

      type Actual = t.MergeCtx<A, B>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it("should return the second context when the first is undefined", () => {
      type A = undefined;
      type B = { b: "B" };
      type Expected = B;

      type Actual = t.MergeCtx<A, B>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it("should merge the two types when both are defined", () => {
      type A = { a: "A" };
      type B = { b: "B" };
      type Expected = { a: "A"; b: "B" };

      type Actual = t.MergeCtx<A, B>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it("should return the second context's value when both contain the same key", () => {
      type A = { a: "A" };
      type B = { a: "B" };
      type Expected = { a: "B" };

      type Actual = t.MergeCtx<A, B>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });
  });

  describe("MergeRoutes", () => {
    it("should return undefined when both routes are undefined", () => {
      type A = undefined;
      type B = undefined;
      type Expected = undefined;

      type Actual = t.MergeRoutes<A, B>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it("should return the first context when the second is undefined", () => {
      type A = { GET: { "/a": {} } };
      type B = undefined;
      type Expected = A;

      type Actual = t.MergeRoutes<A, B>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it("should return the second context when the first is undefined", () => {
      type A = undefined;
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
    it("should merge two blank app data together", () => {
      type A = {};
      type B = {};
      type Expected = {};

      type Actual = t.MergeAppData<A, B>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it("should merge two partial app data together", () => {
      type A = { ctx: { a: "A" } };
      type B = { routes: { GET: { "/b": {} } } };
      type Expected = {
        ctx: { a: "A" };
        routes: { GET: { "/b": {} } };
      };

      type Actual = t.MergeAppData<A, B>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it("should merge two full app data together", () => {
      type A = { ctx: { a: "A" }; routes: { GET: { "/a": {} } } };
      type B = { ctx: { b: "B" }; routes: { GET: { "/b": {} } } };
      type Expected = {
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
    it("should do nothing if the app doesn't have a base", () => {
      type MyApp = t.App<{
        routes: {
          GET: { "/test": { body: z.ZodObject<{ id: z.ZodString }> } };
        };
      }>;
      type Expected = MyApp;

      type Actual = t.ApplyAppPrefix<MyApp>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it("should do nothing if the app doesn't have a base", () => {
      type MyApp = t.App<{
        base: "/api";
        routes: {
          GET: { "/test": { body: z.ZodObject<{ id: z.ZodString }> } };
        };
      }>;
      type Expected = t.App<{
        routes: {
          GET: { "/api/test": { body: z.ZodObject<{ id: z.ZodString }> } };
        };
      }>;

      type Actual = t.ApplyAppPrefix<MyApp>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });
  });
});
