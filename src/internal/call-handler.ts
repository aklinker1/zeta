import { type MatchedRoute } from "rou3";
import { HandlerResult, type RouterData } from "../types";
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

  if (route.data.hooks.onTransform.length > 0) {
    const onTransformResponse = await callCtxModifierHooks(
      ctx,
      route.data.hooks.onTransform,
    );
    if (onTransformResponse) return onTransformResponse;
  }

  if (route.data.def?.body)
    ctx.body = validateInputSchema(route.data.def?.body, rawBody);
  if (route.data.def?.query)
    ctx.query = validateInputSchema(route.data.def?.query, rawQuery);
  if (route.data.def?.params)
    ctx.params = validateInputSchema(route.data.def?.params, rawParams);

  if (route.data.hooks.onBeforeHandle.length > 0) {
    const res = await callCtxModifierHooks(
      ctx,
      route.data.hooks.onBeforeHandle,
    );
    if (res) return res;
  }

  if (route.data.def?.responses) {
    ctx.status = (status: number, body: any) => ({
      [HandlerResult]: true,
      status,
      body,
    });
  }

  let response: any = route.data.handler(ctx);
  if (response instanceof Promise) response = await response;

  ctx.response = response;

  for (const hook of route.data.hooks.onAfterHandle) {
    let res = hook.callback(ctx);
    res = res instanceof Promise ? await res : res;
    if (res instanceof Response) return res;
    ctx.response = res;
  }

  if (!(ctx.response instanceof Response)) {
    if (route.data.def?.responses) {
      if (!ctx.response || !ctx.response[HandlerResult]) {
        throw new Error(
          "When `responses` is defined, you must return a value from `ctx.status()`.",
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
    } else if (route.data.def?.response) {
      ctx.response = validateOutputSchema(
        route.data.def.response,
        ctx.response,
      );
    }
  }

  if (response instanceof Response) return response;

  for (const hook of route.data.hooks.onMapResponse) {
    let res = hook.callback(ctx);
    res = res instanceof Promise ? await res : res;
    if (res instanceof Response) return res;
    ctx.response = res;
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
      "Content-Type": resBody.contentType,
      ...ctx.set.headers,
    },
  });
}
