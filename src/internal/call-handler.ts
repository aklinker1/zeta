import { type MatchedRoute } from "rou3";
import type { RouterData } from "../types";
import { NotFoundError } from "../errors";
import {
  callCtxModifierHooks,
  getRawParams,
  getRawQuery,
  validateInputSchema,
  validateOutputSchema,
} from "./utils";
import { smartDeserialize, smartSerialize } from "./serialization";

export async function callHandler(
  ctx: any,
  getRoute: (
    method: string,
    path: string,
  ) => MatchedRoute<RouterData> | undefined,
): Promise<Response> {
  const route = getRoute(ctx.method, ctx.path);
  if (route == null) {
    throw new NotFoundError(undefined, {
      method: ctx.method,
      path: ctx.path,
    });
  }

  if ("fetch" in route.data) {
    const res = route.data.fetch(ctx.request);
    return res instanceof Promise ? await res : res;
  }

  const rawBody = await smartDeserialize(ctx.request);
  const rawQuery = getRawQuery(ctx.url);
  const rawParams = getRawParams(route);
  ctx.route = route.data.route;
  ctx.params = rawParams;
  ctx.query = rawQuery;
  ctx.body = rawBody;

  if (route.data.hooks.transform.length > 0) {
    const transformResponse = await callCtxModifierHooks(
      ctx,
      route.data.hooks.transform,
    );
    if (transformResponse) return transformResponse;
  }

  if (route.data.def?.body)
    ctx.body = validateInputSchema(route.data.def?.body, rawBody);
  if (route.data.def?.query)
    ctx.query = validateInputSchema(route.data.def?.query, rawQuery);
  if (route.data.def?.params)
    ctx.params = validateInputSchema(route.data.def?.params, rawParams);

  if (route.data.hooks.beforeHandle.length > 0) {
    const res = await callCtxModifierHooks(ctx, route.data.hooks.beforeHandle);
    if (res) return res;
  }

  let response: any = route.data.handler(ctx);
  if (response instanceof Promise) response = await response;

  ctx.response = response;

  for (const hook of route.data.hooks.afterHandle) {
    let res = hook.callback(ctx);
    res = res instanceof Promise ? await res : res;
    if (res instanceof Response) return res;
    ctx.response = res;
  }

  if (route.data.def?.response) {
    if ("~standard" in route.data.def.response) {
      ctx.response = validateOutputSchema(route.data.def.response, response);
    } else {
      throw Error("TODO: Validate response map");
    }
  }

  if (response instanceof Response) return response;

  for (const hook of route.data.hooks.mapResponse) {
    let res = hook.callback(ctx);
    res = res instanceof Promise ? await res : res;
    if (res instanceof Response) return res;
    ctx.response = res;
  }

  const resBody = smartSerialize(response);
  if (!resBody)
    return new Response(undefined, {
      status: ctx.set.status,
      headers: ctx.set.headers,
    });

  return new Response(resBody.serialized, {
    status: ctx.set.status,
    headers: {
      "Content-Type": resBody.contentType,
      ...ctx.set.headers,
    },
  });
}
