import { createApp } from "@aklinker1/zeta";
import { trace } from "@opentelemetry/api";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-node";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";

// Initialize you SDK: https://opentelemetry.io/docs/languages/js/instrumentation
const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: "example",
    [ATTR_SERVICE_VERSION]: "1.0",
  }),
  traceExporter: new ConsoleSpanExporter(),
});
sdk.start();

// Create a tracer for request times
const tracer = trace.getTracer("zeta");

// Use a plugin to hook into when every request starts and finishes for tracing.
const openTelemetryPlugin = createApp()
  .onGlobalRequest(({ method, path }) => {
    const requestId = crypto.randomUUID();
    const requestSpan = tracer.startSpan("request", {
      attributes: { requestId, method, path },
    });
    return { requestSpan };
  })
  .onGlobalAfterResponse(({ requestSpan }) => {
    requestSpan.end();
  })
  .export();

const app = createApp()
  .use(openTelemetryPlugin)
  .get("/", () => "OK");

app.listen(3000, () => {
  console.log("Open telemetry example started.");
  console.log("");
  console.log(
    "Open http://localhost:3000. It might take a few seconds after opening the URL to see the span in the console.",
  );
});
