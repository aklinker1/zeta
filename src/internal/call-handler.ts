import { type MatchedRoute } from "rou3";
import type { RouterData } from "../types";
import { NotFoundError } from "../errors";
import {
  getUrlQuery,
  smartDeserialize,
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
    if (res instanceof Promise) {
      return await res;
    } else {
      return res;
    }
  }

  const rawBody = await smartDeserialize(request);

  const rawParams = route.params ?? {};
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
    // TODO: Add decorators
    request,
    url,
    path: url.pathname,
    method: request.method,
    body,
    params,
    query,
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
  if (res == null) return new Response(undefined, { status: Status.Ok });
  if (typeof res === "object") return Response.json(res, { status: Status.Ok });

  return new Response((res as any).toString(), {
    status: Status.Ok,
    headers: { "Content-Type": "text/plain" },
  });
}
