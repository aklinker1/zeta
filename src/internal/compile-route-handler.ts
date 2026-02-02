import { getMeta } from "../meta";
import type {
  CompiledRouteHandler,
  LifeCycleHookName,
  LifeCycleHooks,
  MaybePromise,
  OnBeforeHandleContext,
  RouteDef,
  SchemaAdapter,
  ServerSideFetch,
} from "../types";
import { smartDeserialize, smartSerialize } from "./serialization";
import {
  cleanupCompiledWhitespace,
  IsStatusResult,
  validateInputSchema,
  validateOutputSchema,
} from "./utils";

export function compileRouteHandler(
  options: CompileOptions,
): CompiledRouteHandler {
  if (options.fetch) {
    return new Function(`
      return (request, ctx) => ctx.matchedRoute.data.fetch(request)
      //#sourceURL=${getSourceUrl(options)}
    `)();
  }

  const responseContentTypeMap = getResponseContentTypeMap(options);

  const js = `
return async (request, ctx) => {
  ${options.method === "GET" ? "" : ADD_CTX_BODY}

${options.hooks.onTransform?.length ? compileCtxModifierHookCall("onTransform", options.hooks.onTransform.length) : ""}

  ${options.def?.body ? "ctx.body = utils.validateInputSchema(ctx.matchedRoute.data.def.body, ctx.body);" : ""}
  ${options.def?.params ? "ctx.params = utils.validateInputSchema(ctx.matchedRoute.data.def.params, ctx.params);" : ""}
  ${options.def?.query ? "ctx.query = utils.validateInputSchema(ctx.matchedRoute.data.def.query, ctx.query);" : ""}

${options.hooks.onBeforeHandle?.length ? compileCtxModifierHookCall("onBeforeHandle", options.hooks.onBeforeHandle.length) : ""}

  ctx.response = await ctx.matchedRoute.data.handler(ctx);
  if (ctx.response) {
    if (ctx.response[utils.IsStatusResult]) {
      ctx.set.status = ctx.response.status;
      ctx.response = ctx.response.body;
    }
    if (typeof ctx.response?.body?.bytes === utils.FUNCTION) return ctx.response;
  }

  ${compileValidateResponse(options)}

${options.hooks.onAfterHandle?.length ? compileResponseModifierHookCall("onAfterHandle", options.hooks.onAfterHandle.length) : ""}

${options.hooks.onMapResponse?.length ? compileResponseModifierHookCall("onMapResponse", options.hooks.onMapResponse.length) : ""}

  if (ctx.response == null) {
    return (
      ctx.response = new Response(undefined, {
        status: ctx.set.status,
        headers: ctx.set.headers,
      })
    )
  }

  const serialized = utils.smartSerialize(ctx.response);
  if (!ctx.set.headers["Content-Type"]) ctx.set.headers["Content-Type"] = ${responseContentTypeMap ? "responseContentTypeMap[ctx.set.status] ??" : ""} serialized.contentType
  return (
    ctx.response = new Response(serialized.value, {
      status: ctx.set.status,
      headers: ctx.set.headers,
    })
  )
}
//#sourceURL=${getSourceUrl(options)}
  `;
  return new Function(
    "utils",
    "responseContentTypeMap",
    cleanupCompiledWhitespace(js),
  )(UTILS, responseContentTypeMap);
}

// These functions are available in the generated code via the "utils" object.
const UTILS = {
  smartDeserialize,
  smartSerialize,
  FUNCTION: "function",
  IsStatusResult,
  validateInputSchema,
  validateOutputSchema,
};

type CompileOptions = {
  schemaAdapter: SchemaAdapter | undefined;
  def: RouteDef | undefined;
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
      `    if (typeof ${resultVar}.body?.bytes === utils.FUNCTION)`,
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
      `  if (typeof ${resultVar}.body?.bytes === utils.FUNCTION)`,
      `    return ${resultVar};`,
    );
  }

  return lines.join("\n");
}

function compileValidateResponse(options: CompileOptions): string {
  // No schemas defined
  if (!options.def?.responses) return "";

  // One schema defined
  if ("~standard" in options.def.responses)
    return "ctx.response = utils.validateOutputSchema(ctx.matchedRoute.data.def.responses, ctx.response);";

  // Multiple schemas based on the status code
  return "ctx.response = utils.validateOutputSchema(ctx.matchedRoute.data.def.responses[ctx.set.status], ctx.response);";
}

function getResponseContentTypeMap(
  options: CompileOptions,
): Record<number, string> | undefined {
  // No schemas defined
  if (!options.def?.responses) return;

  // One schema defined
  if ("~standard" in options.def.responses) {
    const { contentType } = getMeta(
      options.schemaAdapter,
      options.def.responses,
    );
    if (!contentType) return;

    return { [200]: contentType };
  }

  // Multiple schemas based on the status code
  const map: Record<number, string> = {};
  for (const [status, schema] of Object.entries(options.def.responses)) {
    const { contentType } = getMeta(options.schemaAdapter, schema);
    map[Number(status)] = contentType;
  }
  if (Object.keys(map).length === 0) return;

  return map;
}
