import { getMeta } from "../meta";
import type {
  CompiledRouteHandler,
  LifeCycleHook,
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
  JSON_RESPONSE_INIT,
  RESPONSE_TAG,
  TEXT_RESPONSE_INIT,
  validateInputSchema,
  validateOutputSchema,
} from "./utils";

export function compileRouteHandler(options: CompileOptions): CompiledRouteHandler {
  const responseContentTypeMap = options.fetch ? undefined : getResponseContentTypeMap(options);
  const js = compileRouteHandlerSource(options, responseContentTypeMap);
  return new Function("utils", "responseContentTypeMap", js)(UTILS, responseContentTypeMap);
}

/**
 * Generates the source compiled by `compileRouteHandler`. Exported so tests can
 * assert on the generated code.
 */
export function compileRouteHandlerSource(
  options: CompileOptions,
  responseContentTypeMap: Record<number, string> | undefined = getResponseContentTypeMap(options),
): string {
  const sourceUrl = getSourceUrl(options);
  if (options.fetch) {
    return `return (request, ctx) => ctx.matchedRoute.data.fetch(request)\n//#sourceURL=${sourceUrl}\n`;
  }

  const chain = new HandlerChain();

  if (options.method !== "GET") {
    const body = chain.split("utils.smartDeserialize(request)");
    chain.push(`ctx.body = ${body};`);
  }

  compileCtxModifierHooks(chain, "onTransform", options.hooks.onTransform);

  if (options.def?.body)
    chain.push("ctx.body = utils.validateInputSchema(ctx.matchedRoute.data.def.body, ctx.body);");
  if (options.def?.params)
    chain.push(
      "ctx.params = utils.validateInputSchema(ctx.matchedRoute.data.def.params, ctx.params);",
    );
  if (options.def?.query)
    chain.push(
      "ctx.query = utils.validateInputSchema(ctx.matchedRoute.data.def.query, ctx.query);",
    );

  compileCtxModifierHooks(chain, "onBeforeHandle", options.hooks.onBeforeHandle);

  const result = chain.split("ctx.matchedRoute.data.handler(ctx)");
  chain.push(
    `ctx.response = ${result};`,
    "if (ctx.response) {",
    "  if (ctx.response[utils.IsStatusResult]) {",
    "    ctx.set.status = ctx.response.status;",
    "    ctx.response = ctx.response.body;",
    "  }",
    "  if (ctx.response?.[Symbol.toStringTag] === utils.RESPONSE_TAG) return ctx.response;",
    "}",
  );

  const validateResponse = compileValidateResponse(options);
  if (validateResponse) chain.push(validateResponse);

  compileResponseModifierHooks(chain, "onAfterHandle", options.hooks.onAfterHandle);
  compileResponseModifierHooks(chain, "onMapResponse", options.hooks.onMapResponse);

  chain.push(...compileSendResponse(responseContentTypeMap));

  return cleanupCompiledWhitespace(chain.render(sourceUrl));
}

// These functions are available in the generated code via the "utils" object.
const UTILS = {
  smartDeserialize,
  smartSerialize,
  FUNCTION: "function",
  IsStatusResult,
  JSON_RESPONSE_INIT,
  RESPONSE_TAG,
  TEXT_RESPONSE_INIT,
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

/**
 * Builds the source of a route handler as a chain of "steps", split at each
 * point where a value might be a promise.
 *
 * Compiling to a single `async` function is simpler, but it forces every
 * request through the promise machinery even when nothing in the pipeline is
 * actually async. Instead, each possibly-async expression checks its own result
 * and only defers to `.then()` when it really got a promise, so a route with a
 * synchronous handler and synchronous hooks runs start-to-finish synchronously
 * and returns a `Response` rather than a `Promise<Response>`.
 */
class HandlerChain {
  #segments: string[][] = [[]];

  push(...lines: string[]): void {
    this.#segments[this.#segments.length - 1]!.push(...lines);
  }

  /**
   * Ends the current step with `expr`, continuing the rest of the handler in a
   * new step once the value settles.
   *
   * @returns The name of the variable holding the settled value. Only valid in
   * code pushed after this call.
   */
  split(expr: string): string {
    const index = this.#segments.length - 1;
    const value = `value${index}`;
    const next = `step${index + 1}`;
    this.push(
      `const ${value} = ${expr};`,
      `if (${value} != null && typeof ${value}.then === utils.FUNCTION)`,
      `  return ${value}.then(resolved => ${next}(request, ctx, resolved));`,
      `return ${next}(request, ctx, ${value});`,
    );
    this.#segments.push([]);
    return value;
  }

  render(sourceUrl: string): string {
    const fns = this.#segments.map((lines, i) => {
      // Every step but the first receives the value the previous step split on.
      const args = i === 0 ? "request, ctx" : `request, ctx, value${i - 1}`;
      const body = lines.map((line) => `  ${line}`).join("\n");
      return `function step${i}(${args}) {\n${body}\n}`;
    });
    return `${fns.join("\n\n")}\n\nreturn step0;\n//#sourceURL=${sourceUrl}\n`;
  }
}

function compileCtxModifierHooks(
  chain: HandlerChain,
  hook: LifeCycleHookName,
  hooks: LifeCycleHook<any>[] | undefined,
): void {
  if (!hooks?.length) return;

  for (let i = 0; i < hooks.length; i++) {
    const path = `ctx.matchedRoute.data.hooks.${hook}[${i}]`;

    // `app.decorate` values are known at compile time, so they can be assigned
    // straight onto the context - no call, no `Object.keys`, no async check.
    const { decoration } = hooks[i]!;
    if (decoration) {
      for (const key of Object.keys(decoration)) {
        chain.push(`ctx[${JSON.stringify(key)}] = ${path}.decoration[${JSON.stringify(key)}];`);
      }
      continue;
    }

    const res = chain.split(`${path}.callback(ctx)`);
    chain.push(
      `if (${res}) {`,
      `  if (${res}[Symbol.toStringTag] === utils.RESPONSE_TAG) return ${res};`,
      `  for (const key of Object.keys(${res})) ctx[key] = ${res}[key];`,
      `}`,
    );
  }
}

function compileResponseModifierHooks(
  chain: HandlerChain,
  hook: LifeCycleHookName,
  hooks: LifeCycleHook<any>[] | undefined,
): void {
  if (!hooks?.length) return;

  for (let i = 0; i < hooks.length; i++) {
    const res = chain.split(`ctx.matchedRoute.data.hooks.${hook}[${i}].callback(ctx)`);
    chain.push(
      `if (${res}) {`,
      `  ctx.response = ${res};`,
      `  if (${res}[Symbol.toStringTag] === utils.RESPONSE_TAG) return ${res};`,
      `}`,
    );
  }
}

function compileValidateResponse(options: CompileOptions): string | undefined {
  // No schemas defined
  if (!options.def?.responses) return;

  // One schema defined
  if ("~standard" in options.def.responses)
    return "ctx.response = utils.validateOutputSchema(ctx.matchedRoute.data.def.responses, ctx.response);";

  // Multiple schemas based on the status code
  return "ctx.response = utils.validateOutputSchema(ctx.matchedRoute.data.def.responses[ctx.set.status], ctx.response);";
}

/**
 * Turns `ctx.response` into a `Response`.
 *
 * When the route didn't customize the status or headers (by far the most common
 * case), strings and plain JSON values skip `smartSerialize` and reuse a shared
 * `ResponseInit`, which avoids re-parsing a headers object literal on every
 * request. See `createContentTypeInit` - that parsing costs roughly as much as
 * the rest of the request pipeline combined.
 */
function compileSendResponse(responseContentTypeMap: Record<number, string> | undefined): string[] {
  const lines = ["const status = ctx.set.status;", "const headers = ctx.set.rawHeaders;"];

  // A route-specific content type means we can't let the runtime pick one.
  const canFastPath = responseContentTypeMap == null;

  lines.push(
    "if (ctx.response == null)",
    canFastPath
      ? "  return (ctx.response = status === 200 && headers === undefined ? new Response() : new Response(undefined, { status, headers }));"
      : "  return (ctx.response = new Response(undefined, { status, headers }));",
  );

  if (canFastPath) {
    lines.push(
      "if (status === 200 && headers === undefined) {",
      "  const type = typeof ctx.response;",
      '  if (type === "object") {',
      "    const ctor = ctx.response.constructor;",
      "    if (ctor === Object || ctor === Array)",
      "      return (ctx.response = new Response(JSON.stringify(ctx.response), utils.JSON_RESPONSE_INIT));",
      '  } else if (type === "string") {',
      "    return (ctx.response = new Response(ctx.response, utils.TEXT_RESPONSE_INIT));",
      "  }",
      "}",
    );
  }

  lines.push(
    "const serialized = utils.smartSerialize(ctx.response);",
    `const contentType = ${responseContentTypeMap ? "responseContentTypeMap[status] ?? " : ""}serialized.contentType;`,
    "const outHeaders = ctx.set.headers;",
    'if (contentType && !outHeaders["Content-Type"]) outHeaders["Content-Type"] = contentType;',
    "return (ctx.response = new Response(serialized.value, { status, headers: outHeaders }));",
  );

  return lines;
}

function getResponseContentTypeMap(options: CompileOptions): Record<number, string> | undefined {
  // No schemas defined
  if (!options.def?.responses) return;

  // One schema defined
  if ("~standard" in options.def.responses) {
    const { contentType } = getMeta(options.schemaAdapter, options.def.responses);
    if (!contentType) return;

    return { [200]: contentType };
  }

  // Multiple schemas based on the status code
  const map: Record<number, string> = {};
  let empty = true;
  for (const [status, schema] of Object.entries(options.def.responses)) {
    const { contentType } = getMeta(options.schemaAdapter, schema);
    if (!contentType) continue;
    map[Number(status)] = contentType;
    empty = false;
  }
  if (empty) return;

  return map;
}
