import type { MatchedRoute } from "rou3";

import { asyncLocalStorage } from "../async-local-storage";
import { HttpError, NotFoundHttpError } from "../errors";
import { HttpStatus } from "../status";
import type { AnyTransport, LifeCycleHooks, RouterData, ServerSideFetch } from "../types";
import { Context } from "./context";
import { cleanupCompiledWhitespace, getRawPathname, serializeErrorResponse } from "./utils";

export function compileFetchFunction(options: CompileOptions): ServerSideFetch {
  const onGlobalRequestCount = options.hooks.onGlobalRequest?.length;
  const onGlobalAfterResponseCount = options.hooks.onGlobalAfterResponse?.length;
  const onGlobalErrorCount = options.hooks.onGlobalError?.length;

  const js = `
return (request${options.transport?.decorate ? ", ...args" : ""}) => {
  const path = utils.getRawPathname(request);
  const ctx = new utils.Context(request, path, utils.origin);
  ${options.transport?.decorate ? `utils.transport.decorate(ctx, request, ...args);` : ""}
  ${onGlobalAfterResponseCount ? "let handlerReturnedPromise = false;" : ""}

  return utils.asyncLocalStorage.run(ctx.getStoreMap(), () => {
    try {
${onGlobalRequestCount ? compileOnGlobalRequestHook(onGlobalRequestCount, 3) : ""}

      const matchedRoute = utils.getRoute(request.method, path);
      if (matchedRoute == null) {
        throw new utils.NotFoundHttpError(undefined, {
          method: request.method,
          path,
        });
      } else {
        ctx.matchedRoute = matchedRoute;
      }

      ctx.response = matchedRoute.data.compiledHandler(request, ctx);
      if (typeof ctx.response.then !== utils.FUNCTION) return ctx.response;

      ${onGlobalAfterResponseCount ? "handlerReturnedPromise = true;" : ""}
      return ctx.response.catch(error => {
${onGlobalErrorCount ? compileOnGlobalErrorHook(onGlobalErrorCount, 4) : ""}

${compileErrorResponse(4)}
      })${onGlobalAfterResponseCount ? compileOnGlobalAfterResponsePromiseFinally(onGlobalAfterResponseCount, 3) : ""};
    } catch (error) {
${onGlobalErrorCount ? compileOnGlobalErrorHook(onGlobalErrorCount, 3) : ""}

${compileErrorResponse(3)}
    } ${onGlobalAfterResponseCount ? compileOnGlobalAfterResponseFinally(onGlobalAfterResponseCount, 2) : ""}
  });
}
//#sourceURL=zeta-jit-generated://zeta-fetch-fn.js
  `;
  return new Function("utils", cleanupCompiledWhitespace(js))({
    FUNCTION: "function",
    getRawPathname,
    hooks: options.hooks,
    Context,
    getRoute: options.getRoute,
    NotFoundHttpError,
    origin: options.origin,
    HttpError,
    HttpStatus,
    serializeErrorResponse,
    transport: options.transport,
    asyncLocalStorage,
  });
}

function compileOnGlobalRequestHook(hookCount: number, tabs: number = 2): string {
  const indent = "  ".repeat(tabs);
  const lines: string[] = [];

  for (let i = 0; i < hookCount; i++) {
    const resultVar = `onGlobalRequestRes${i}`;
    lines.push(
      `${indent}const ${resultVar} = utils.hooks.onGlobalRequest[${i}].callback(ctx);`,
      ...(process.env.NODE_ENV !== "production"
        ? [
            `${indent}if (${resultVar} instanceof Promise)`,
            `${indent}  console.warn("Warning: Promise returned from onGlobalRequest hook. Promises returned from onGlobalRequest are not awaited, ignoring the return value.");`,
          ]
        : []),
      `${indent}if (${resultVar})`,
      `${indent}  if (typeof ${resultVar}.body?.bytes === utils.FUNCTION)`,
      `${indent}    return ${resultVar};`,
      `${indent}  else`,
      `${indent}    for (const key of Object.keys(${resultVar}))`,
      `${indent}      ctx[key] = ${resultVar}[key];`,
    );
  }

  return lines.join("\n");
}

function compileOnGlobalErrorHook(hookCount: number, tabs: number): string {
  const indent = "  ".repeat(tabs);
  const lines: string[] = [`${indent}ctx.error = error;`];

  for (let i = 0; i < hookCount; i++) {
    lines.push(`${indent}utils.hooks.onGlobalError[${i}].callback(ctx);`);
  }

  return lines.join("\n");
}

function compileOnGlobalAfterResponseFinally(hookCount: number, tabs: number): string {
  const indent = "  ".repeat(tabs);
  return `finally {
${indent}  if (!handlerReturnedPromise) {
${compileOnGlobalAfterResponseHook(hookCount, tabs + 2)}
${indent}  }
${indent}}
`;
}

function compileOnGlobalAfterResponsePromiseFinally(hookCount: number, tabs: number): string {
  const indent = "  ".repeat(tabs);
  return `.finally(() => {
${compileOnGlobalAfterResponseHook(hookCount, tabs + 1)}
${indent}})`;
}

function compileOnGlobalAfterResponseHook(hookCount: number, tabs: number): string {
  const indent = "  ".repeat(tabs);
  const lines: string[] = [`${indent}setTimeout(() => {`];

  for (let i = 0; i < hookCount; i++) {
    lines.push(`${indent}  utils.hooks.onGlobalAfterResponse[${i}].callback(ctx);`);
  }

  lines.push(`${indent}})`);

  return lines.join("\n");
}

function compileErrorResponse(tabs: number): string {
  const indent = "  ".repeat(tabs);
  return `${indent}const status =
${indent}  error instanceof utils.HttpError
${indent}    ? error.status
${indent}    : utils.HttpStatus.InternalServerError;
${indent}return (
${indent}  ctx.response = Response.json(
${indent}    utils.serializeErrorResponse(error),
${indent}    { status, headers: ctx.set.headers },
${indent}  )
${indent});`;
}

type CompileOptions = {
  hooks: LifeCycleHooks;
  getRoute: (method: string, path: string) => MatchedRoute<RouterData> | undefined;
  origin: string;
  transport: AnyTransport;
};
