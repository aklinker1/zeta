import { type MatchedRoute } from "rou3";
import type { RouterData } from "../types";
import { NotFoundError } from "../errors";
import {
  getUrlQuery,
  smartDeserialize,
  smartSerialize,
  validateInputSchema,
  validateOutputSchema,
} from "./utils";
import { Status } from "../status";

export async function callHandler(
  request: Request,
  url: URL,
  getRoute: (
    method: string,
    path: string,
  ) => MatchedRoute<RouterData> | undefined,
): Promise<Response> {
  const route = getRoute(request.method, url.pathname);
  if (route == null) {
    throw new NotFoundError(undefined, {
      method: request.method,
      path: url.pathname,
    });
  }

  if ("fetch" in route.data) {
    const res = route.data.fetch(request);
    return res instanceof Promise ? await res : res;
  }

  const rawBody = await smartDeserialize(request);

  const rawParams = route.params ?? {};
  // Rename _ to ** for validation and consistency
  if ("_" in rawParams) {
    rawParams["**"] = rawParams["_"];
    delete rawParams["_"];
  }
  const params = route.data.def?.params
    ? validateInputSchema(route.data.def.params, rawParams)
    : rawParams;

  const rawQuery = getUrlQuery(url);
  const query = route.data.def?.query
    ? validateInputSchema(route.data.def?.query, rawQuery)
    : rawQuery;

  const body = route.data.def?.body
    ? validateInputSchema(route.data.def?.body, rawBody)
    : rawBody;

  const ctx = {
    request,
    url,
    path: url.pathname,
    method: request.method,
    body,
    params,
    query,
    ...route.data.pluginData.decorators,
  };

  let res = (route.data as any).handler(ctx as any);
  if (res instanceof Promise) res = await res;

  if (route.data.def?.response) {
    if ("~standard" in route.data.def.response) {
      res = validateOutputSchema(route.data.def.response, res);
    } else {
      throw Error("TODO: Validate response map");
    }
  }

  if (res instanceof Response) return res;

  const resBody = smartSerialize(res);
  if (!resBody) return new Response(undefined, { status: Status.Ok });

  return new Response(resBody.serialized, {
    status: Status.Ok,
    headers: { "Content-Type": resBody.contentType },
  });
}
