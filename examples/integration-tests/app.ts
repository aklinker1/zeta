import { createApp } from "@aklinker1/zeta";
import { db } from "./dependencies";

export const app = createApp()
  .onGlobalRequest(() => ({ startTime: new Date() }))
  .onGlobalAfterResponse(({ method, path, response, startTime }) => {
    db.run(
      `
        INSERT INTO request_history (id, start_time, path, method, status_code)
        VALUES (?, ?, ?, ?, ?)
      `,
      [
        crypto.randomUUID(),
        startTime.toISOString(),
        path,
        method,
        response.status,
      ],
    );
  })
  .get("/", () =>
    db
      .query("SELECT * FROM request_history ORDER BY datetime(start_time) DESC")
      .all(),
  )
  .get("/one", () => "OK")
  .get("/two", () => "OK");
