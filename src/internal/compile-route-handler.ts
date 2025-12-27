import type { MaybePromise } from "elysia";
import type {
  CompiledRouteHandler,
  LifeCycleHookName,
  LifeCycleHooks,
  OnBeforeHandleContext,
  RouteDef,
  ServerSideFetch,
} from "../types";
import { smartDeserialize, smartSerialize } from "./serialization";
import { cleanupCompiledWhitespace, IsStatusResult } from "./utils";

export function compileRouteHandler(
  options: CompileOptions,
): CompiledRouteHandler {
  if (options.fetch) {
    return new Function(`
      return (request, ctx) => ctx.matchedRoute.data.fetch(request)
      //#sourceURL=${getSourceUrl(options)}
    `)();
  }

  const js = `
return async (request, ctx) => {
  ${options.method === "GET" ? "" : ADD_CTX_BODY}

  // TODO: Add back ability to return responses from hooks to short-circuit the handler

${options.hooks.onTransform?.length ? compileCtxModifierHookCall("onTransform", options.hooks.onTransform.length) : ""}

  ${options.def?.body ? "ctx.body = ctx.matchedRoute.data.def.body.parse(ctx.body);" : ""}
  ${options.def?.params ? "ctx.params = ctx.matchedRoute.data.def.params.parse(ctx.params);" : ""}
  ${options.def?.query ? "ctx.query = ctx.matchedRoute.data.def.query.parse(ctx.query);" : ""}

${options.hooks.onBeforeHandle?.length ? compileCtxModifierHookCall("onBeforeHandle", options.hooks.onBeforeHandle.length) : ""}

  ctx.response = await ctx.matchedRoute.data.handler(ctx);
  if (ctx.response) {
    if (ctx.response[utils.IsStatusResult]) {
      set.status = ctx.response.status;
      ctx.response = ctx.response.body;
    }
    if (typeof ctx.response.body === utils.FUNCTION) return ctx.response;
  }

  ${compileValidateResponse(options)}

${options.hooks.onAfterHandle?.length ? compileResponseModifierHookCall("onAfterHandle", options.hooks.onAfterHandle.length) : ""}

${options.hooks.onMapResponse?.length ? compileResponseModifierHookCall("onMapResponse", options.hooks.onMapResponse.length) : ""}

  if (ctx.response == null) {
    return new Response(undefined, {
      status: ctx.set.status,
      headers: ctx.set.headers,
    })
  }

  const serialized = utils.smartSerialize(ctx.response);
  ctx.set.headers["Content-Type"] = serialized.contentType; // TODO: responseMeta?.contentType ?? serialized.contentType
  return new Response(serialized.value, {
    status: ctx.set.status,
    headers: ctx.set.headers,
  })
}
//#sourceURL=${getSourceUrl(options)}
  `;
  return new Function("utils", cleanupCompiledWhitespace(js))(UTILS);
}

// These functions are available in the generated code via the "utils" object.
const UTILS = {
  smartDeserialize,
  smartSerialize,
  FUNCTION: "function",
  IsStatusResult,
};

type CompileOptions = {
  def?: RouteDef;
  method: string;
  route: string;
  hooks: LifeCycleHooks;
  fetch?: ServerSideFetch;
  handler?: (ctx: OnBeforeHandleContext) => MaybePromise<any>;
};

function getSourceUrl(options: CompileOptions) {
  return `zeta-jit-generated://${options.method.toLowerCase()}-${options.route.replace(/\s/gm, "").replaceAll("/", "-")}.js`;
}

const ADD_CTX_BODY = `
  ctx.body = utils.smartDeserialize(request);
  if (ctx.body) ctx.body = await ctx.body;
`;

function compileCtxModifierHookCall(
  hook: LifeCycleHookName,
  hookCount: number,
): string {
  const lines: string[] = [];

  for (let i = 0; i < hookCount; i++) {
    const resultVar = `${hook}Res${i}`;
    lines.push(
      `  const ${resultVar} = await ctx.matchedRoute.data.hooks.${hook}[${i}].callback(ctx);`,
      `  if (${resultVar})`,
      `    if (typeof ${resultVar}.body === utils.FUNCTION)`,
      `      return ${resultVar};`,
      `    else`,
      `      for (const key of Object.keys(${resultVar}))`,
      `        ctx[key] = ${resultVar}[key];`,
    );
  }

  return lines.join("\n");
}

function compileResponseModifierHookCall(
  hook: LifeCycleHookName,
  hookCount: number,
): string {
  const lines: string[] = [];

  for (let i = 0; i < hookCount; i++) {
    const resultVar = `${hook}Res${i}`;
    lines.push(
      `  const ${resultVar} = await ctx.matchedRoute.data.hooks.${hook}[${i}].callback(ctx);`,
      `  if (${resultVar}) ctx.response = ${resultVar};`,
      `  if (typeof ${resultVar}.body === utils.FUNCTION)`,
      `    return ${resultVar};`,
    );
  }

  return lines.join("\n");
}

function compileValidateResponse(options: CompileOptions): string {
  // No validation
  if (!options.def?.responses) return "";

  // One schema defined
  if ("~standard" in options.def.responses)
    return "ctx.response = ctx.matchedRoute.data.def.responses.parse(ctx.response);";

  // Multiple schemas based on the status code
  return "ctx.response = ctx.matchedRoute.data.def.responses[ctx.set.status].parse(ctx.response);";
}
