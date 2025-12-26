import type { MatchedRoute } from "rou3";
import type { RouterData, SchemaAdapter } from "../types";
import { NotFoundHttpError } from "../errors";
import {
  callCtxModifierHooks,
  getRawParams,
  getRawQuery,
  isStatusResult,
  IsStatusResult,
  validateInputSchema,
  validateOutputSchema,
} from "./utils";
import { smartDeserialize, smartSerialize } from "./serialization";
import { getMeta } from "../meta";

export async function callHandler(
  ctx: any,
  getRoute: (
    method: string,
    path: string,
  ) => MatchedRoute<RouterData> | undefined,
  schemaAdapter: SchemaAdapter | undefined,
): Promise<Response> {
  const route = getRoute(ctx.method, ctx.path);
  if (route == null) {
    throw new NotFoundHttpError(undefined, {
      method: ctx.method,
      path: ctx.path,
    });
  }

  if ("fetch" in route.data) {
    const res = route.data.fetch(ctx.request);
    return res instanceof Promise ? await res : res;
  }

  ctx.params = route.params ? getRawParams(route) : {};
  ctx.query = getRawQuery(ctx.request);
  ctx.body = smartDeserialize(ctx.request);
  if (ctx.body instanceof Promise) ctx.body = await ctx.body;

  if (route.data.hooks.onTransform) {
    const response = await callCtxModifierHooks(
      ctx,
      route.data.hooks.onTransform,
    );
    if (response) return response;
  }

  if (route.data.def) {
    if (route.data.def.params)
      ctx.params = validateInputSchema(route.data.def.params, ctx.params);
    if (route.data.def.query)
      ctx.query = validateInputSchema(route.data.def.query, ctx.query);
    if (route.data.def.body)
      ctx.body = validateInputSchema(route.data.def.body, ctx.body);
  }

  if (route.data.hooks.onBeforeHandle) {
    const res = await callCtxModifierHooks(
      ctx,
      route.data.hooks.onBeforeHandle,
    );
    if (res) return res;
  }

  ctx.status = (status: number, body: any) => ({
    [IsStatusResult]: true,
    status,
    body,
  });

  {
    ctx.response = route.data.handler(ctx);
    if (ctx.response instanceof Promise) ctx.response = await ctx.response;
  }

  if (route.data.hooks.onAfterHandle) {
    for (const hook of route.data.hooks.onAfterHandle) {
      let res = hook.callback(ctx);
      if (res instanceof Promise) res = await res;
      if (res instanceof Response) return res;
      ctx.response = res;
    }
  }

  let responseMeta: Record<string, any> | undefined;
  if (!(ctx.response instanceof Response)) {
    if (route.data.def?.responses) {
      if ("~standard" in route.data.def.responses) {
        ctx.response = validateOutputSchema(
          route.data.def.responses,
          ctx.response,
        );
        responseMeta = getMeta(schemaAdapter, route.data.def.responses);
      } else {
        if (!ctx.response || !isStatusResult(ctx.response)) {
          throw new Error(
            "When `responses` is a record of schemas, you must return a value from `ctx.status(...)`.",
          );
        }
        const { status, body } = ctx.response;
        const schema = route.data.def.responses[status];
        if (!schema) {
          // This should be caught by the `status` function's type definition, but it's here as a safeguard.
          throw new Error(`No response schema found for status ${status}.`);
        }
        ctx.set.status = status;
        ctx.response = validateOutputSchema(schema, body);
        responseMeta = getMeta(schemaAdapter, schema);
      }
    }
  }

  if (ctx.response instanceof Response) return ctx.response;

  if (route.data.hooks.onMapResponse) {
    for (const hook of route.data.hooks.onMapResponse) {
      let res = hook.callback(ctx);
      if (res instanceof Promise) res = await res;
      if (res instanceof Response) return res;
      ctx.response = res;
    }
  }

  const resBody = smartSerialize(ctx.response);
  if (!resBody)
    return new Response(undefined, {
      status: ctx.set.status,
      headers: ctx.set.headers,
    });

  return new Response(resBody.serialized, {
    status: ctx.set.status,
    headers: {
      "Content-Type": responseMeta?.contentType ?? resBody.contentType,
      ...ctx.set.headers,
    },
  });
}
