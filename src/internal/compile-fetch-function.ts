import type { MatchedRoute } from "rou3";
import type { LifeCycleHooks, RouterData, ServerSideFetch } from "../types";
import {
  cleanupCompiledWhitespace,
  getRawPathname,
  serializeErrorResponse,
} from "./utils";
import { Context } from "./context";
import { HttpError, NotFoundHttpError } from "../errors";
import { HttpStatus } from "../status";

export function compileFetchFunction(options: CompileOptions): ServerSideFetch {
  const onGlobalRequestCount = options.hooks.onGlobalRequest?.length;
  const onGlobalAfterResponseCount =
    options.hooks.onGlobalAfterResponse?.length;
  const onGlobalErrorCount = options.hooks.onGlobalError?.length;

  const js = `
return (request) => {
  const path = utils.getRawPathname(request);
  const ctx = new utils.Context(request, path, utils.origin);

  try {
${onGlobalRequestCount ? compileOnGlobalRequestHook(onGlobalRequestCount) : ""}

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

    return ctx.response.catch(error => {
${onGlobalErrorCount ? compileOnGlobalErrorHook(onGlobalErrorCount, 3) : ""}

${compileErrorResponse(3)}
    })${onGlobalAfterResponseCount ? compileOnGlobalAfterResponsePromiseFinally(onGlobalAfterResponseCount, 2) : ""};
  } catch (error) {
${onGlobalErrorCount ? compileOnGlobalErrorHook(onGlobalErrorCount, 2) : ""}

${compileErrorResponse(2)}
  } ${onGlobalAfterResponseCount ? compileOnGlobalAfterResponseFinally(onGlobalAfterResponseCount, 1) : ""}
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
  });
}

function compileOnGlobalRequestHook(hookCount: number): string {
  const lines: string[] = [];

  for (let i = 0; i < hookCount; i++) {
    const resultVar = `onGlobalRequestRes${i}`;
    lines.push(
      `    const ${resultVar} = utils.hooks.onGlobalRequest[${i}].callback(ctx);`,
      ...(process.env.NODE_ENV !== "production"
        ? [
            `    if (${resultVar} instanceof Promise)`,
            `      console.warn("Warning: Promise returned from onGlobalRequest hook. Promises returned from onGlobalRequest are not awaited, ignoring the return value.");`,
          ]
        : []),
      `    if (${resultVar})`,
      `      if (typeof ${resultVar}.body?.bytes === utils.FUNCTION)`,
      `        return ${resultVar};`,
      `      else`,
      `        for (const key of Object.keys(${resultVar}))`,
      `          ctx[key] = ${resultVar}[key];`,
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

function compileOnGlobalAfterResponseFinally(
  hookCount: number,
  tabs: number,
): string {
  const indent = "  ".repeat(tabs);
  return `finally {
${compileOnGlobalAfterResponseHook(hookCount, tabs + 1)}
${indent}}
`;
}

function compileOnGlobalAfterResponsePromiseFinally(
  hookCount: number,
  tabs: number,
): string {
  const indent = "  ".repeat(tabs);
  return `.finally(() => {
${compileOnGlobalAfterResponseHook(hookCount, tabs + 1)}
${indent}})`;
}

function compileOnGlobalAfterResponseHook(
  hookCount: number,
  tabs: number,
): string {
  const indent = "  ".repeat(tabs);
  const lines: string[] = [`${indent}setTimeout(() => {`];

  for (let i = 0; i < hookCount; i++) {
    lines.push(
      `${indent}  utils.hooks.onGlobalAfterResponse[${i}].callback(ctx);`,
    );
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
${indent}return (ctx.response = Response.json(utils.serializeErrorResponse(error), { status }));`;
}

type CompileOptions = {
  hooks: LifeCycleHooks;
  getRoute: (
    method: string,
    path: string,
  ) => MatchedRoute<RouterData> | undefined;
  origin: string;
};
