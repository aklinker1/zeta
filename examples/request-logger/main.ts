import { createApp } from "@aklinker1/zeta";
import dedent from "dedent";

// For an overview of when each hook is called, see:
// https://zeta.aklinker1.io/server/hooks

const requestLoggerPlugin = createApp()
  // Log when the request is made and decorate the request context with some
  // values used in later hooks.
  .onGlobalRequest(({ method, path, url }) => {
    const startTime = performance.now(); // Or Date.now()
    const requestId = crypto.randomUUID();
    console.log("Request START", { requestId, method, path, url: String(url) });

    // Return values available in subsequent hooks
    return {
      startTime,
      requestId,
    };
  })

  // onTransform runs after the "route" is matched
  //
  // Route vs path:
  // - Route: The endpoint string ("/api/users/{id}")
  // - Path: The pathname of the URL ("/api/user/123")
  //
  .onTransform(({ requestId, route }) => {
    console.log("Route matched", { requestId, route });
  })

  // If there was an error thrown, log the error.
  .onGlobalError(({ requestId, error }) => {
    console.log("Request ERROR", { requestId, error });
  })

  // Regardless of if there was an error, log that the request ended with it's
  // duration and status.
  .onGlobalAfterResponse(({ requestId, startTime, response }) => {
    console.log("Request END", {
      requestId,
      duration: performance.now() - startTime,
      status: response.status,
    });
  })

  // Finally, export the app to make it a plugin and provide the decorated
  // variables to other Zeta apps that might need them.
  .export();

const app = createApp()
  .use(requestLoggerPlugin)
  .get("/", () => "OK")
  .get("/example", () => "OK");

app.listen(3000, () => {
  console.log(dedent`
    Request logger example started!

    Visit the URLs below to see the request logs:
    - http://localhost:3000
    - http://localhost:3000/example
  `);
});
