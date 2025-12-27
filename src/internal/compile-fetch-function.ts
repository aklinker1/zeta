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
    if (typeof ctx.response.then === utils.FUNCTION) {
      return ctx.response.catch(error => {
${onGlobalErrorCount ? compileOnGlobalErrorHook(onGlobalErrorCount, 4) : ""}

${compileErrorResponse(4)}
      })${onGlobalAfterResponseCount ? compileOnGlobalAfterResponsePromiseFinally(onGlobalAfterResponseCount).replaceAll("\n", "\n    ") : ""}
    }

    return ctx.response;
  } catch (error) {
${onGlobalErrorCount ? compileOnGlobalErrorHook(onGlobalErrorCount, 2) : ""}

${compileErrorResponse(2)}
  } ${onGlobalAfterResponseCount ? compileOnGlobalAfterResponseFinally(onGlobalAfterResponseCount) : ""}
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
      `  const ${resultVar} = ctx.matchedRoute.data.hooks.onGlobalRequest[${i}].callback(ctx);`,
      // TODO: Warn about not allowing promises during development?
      `  if (${resultVar})`,
      `    for (const key of Object.keys(${resultVar}))`,
      `      ctx[key] = ${resultVar}[key];`,
    );
  }

  return lines.join("\n");
}

function compileOnGlobalErrorHook(hookCount: number, tabs: number): string {
  const indent = "  ".repeat(tabs);
  const lines: string[] = [`${indent}ctx.error = error;`];

  for (let i = 0; i < hookCount; i++) {
    lines.push(
      `${indent}ctx.matchedRoute.data.hooks.onGlobalError[${i}].callback(ctx);`,
    );
  }

  return lines.join("\n");
}

function compileOnGlobalAfterResponseFinally(hookCount: number): string {
  return `finally {
${compileOnGlobalAfterResponseHook(hookCount)}
  }
`;
}

function compileOnGlobalAfterResponsePromiseFinally(hookCount: number): string {
  return `.finally(() => {
${compileOnGlobalAfterResponseHook(hookCount)}
  })
`;
}

function compileOnGlobalAfterResponseHook(hookCount: number): string {
  const lines: string[] = ["    setTimeout(() => {"];

  for (let i = 0; i < hookCount; i++) {
    lines.push(
      `      ctx.matchedRoute.data.hooks.onGlobalAfterResponse[${i}].callback(ctx);`,
    );
  }

  lines.push("    })");

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
