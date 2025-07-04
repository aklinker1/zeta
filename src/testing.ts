import {
  createAppClient,
  type AppClient,
  type CreateAppClientOptions,
  type GetClientRoutes,
} from "./client";
import type { App } from "./types";

export function createTestAppClient<TApp extends App>(
  app: TApp,
  options?: Omit<CreateAppClientOptions, "fetch">,
): AppClient<GetClientRoutes<TApp>> {
  const { baseUrl = "http://localhost" } = options ?? {};

  const fetch = app.build();

  return createAppClient({
    baseUrl,
    ...options,
    fetch: (...args) => fetch(new Request(...args)) as any,
  });
}
