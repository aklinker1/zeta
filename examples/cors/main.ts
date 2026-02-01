import { createApp } from "@aklinker1/zeta";
import dedent from "dedent";
import testPage from "./index.html";

export const corsPlugin = createApp()
  .onGlobalRequest(({ method, path, set }) => {
    // NOTE: The `onGlobalRequest` hook is used because it runs on every
    // request, including child apps. Read the docs for more details on global
    // hooks: https://zeta.aklinker1.io/server/hooks/#global-hooks
    //
    // That means if you want to filter which endpoints have CORS enabled, you
    // should do that in this callback using the method and path from the
    // request context. Just return before applying any headers to disable CORS.
    if (!path.startsWith("/api")) return;

    // Set CORS headers on all requests
    set.headers["Access-Control-Allow-Origin"] = "*";
    set.headers["Access-Control-Allow-Methods"] = "GET";
    // ...

    // Shortcircuit OPTIONS requests by returning a `Response` instance, don't
    // call any handlers if defined. For more details, read the docs:
    // https://zeta.aklinker1.io/server/hooks/ontransform/#short-circuiting
    if (method === "OPTIONS") return new Response();
  })
  .export();

const apiApp = createApp({ prefix: "/api" }).get("/cors", () => "OK");

const app = createApp()
  .use(corsPlugin)
  .use(apiApp)
  .get("/no-cors", () => "OK");

// Serve the test page and backend on :3000
const fetch = app.build();
Bun.serve({
  routes: {
    "/": testPage,
    "/**": fetch,
  },
});

// Serve the test HTML page on :3001, a different origin.
Bun.serve({
  port: 3001,
  routes: {
    "/": testPage,
  },
});

console.log(dedent`
  Example servers started!

  Open the http://localhost:3000 and http://localhost:3001 to see CORS in
  action.

  Both pages make fetch requests to http://localhost:3000/*.
  http://localhost:3000 won't have any problems making the 3 test requests, but
  one of the requests on http://localhost:3001 will fail due to CORS because
  it's path doesn't start with "/api".
`);
