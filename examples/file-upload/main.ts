import { createApp, HttpStatus } from "@aklinker1/zeta";
import {
  NoResponse,
  UploadFileBody,
  UploadFilesBody,
} from "@aklinker1/zeta/schema";
import { resolve } from "node:path";
import testPage from "./index.html";

async function writeFile(file: File): Promise<void> {
  const path = resolve("data", file.name);
  await Bun.write(path, file);
  console.log(`Saved ${file.name} to: ${path}`);
}

const app = createApp()
  .post(
    "/upload-one",
    {
      body: UploadFileBody,
      responses: {
        [HttpStatus.Found]: NoResponse,
      },
    },
    async ({ body, status, set }) => {
      await writeFile(body);

      // Redirect since the test webpage uses forms, not JS
      set.headers["Location"] = "/";
      return status(HttpStatus.Found, undefined);
    },
  )
  .post(
    "/upload-many",
    {
      body: UploadFilesBody,
      responses: {
        [HttpStatus.Found]: NoResponse,
      },
    },
    async ({ body, status, set }) => {
      for (const file of body) await writeFile(file);

      // Redirect since the test webpage uses forms, not JS
      set.headers["Location"] = "/";
      return status(HttpStatus.Found, undefined);
    },
  );

Bun.serve({
  routes: {
    "/": testPage,
    "/**": app.build(),
  },
});
