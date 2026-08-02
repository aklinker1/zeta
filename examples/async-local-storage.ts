/**
 * Example demonstrating AsyncLocalStorage for request tracking
 *
 * This example shows how to use the built-in AsyncLocalStorage support
 * to track request IDs and user context throughout the request lifecycle.
 */
import { createApp, getStore } from "../src";

// Logger utility that uses AsyncLocalStorage
function log(level: "INFO" | "WARN" | "ERROR", message: string) {
  try {
    const store = getStore();
    const requestId = store.get<string>("requestId");
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} [${requestId}] [${level}] ${message}`);
  } catch {
    // If called outside request context, fall back to basic logging
    console.log(`[${level}] ${message}`);
  }
}

// Get current user from store
function getCurrentUser() {
  const store = getStore();
  return store.get<{ id: number; name: string }>("user");
}

// Example database queries
async function fetchUserPosts(userId: number) {
  log("INFO", `Fetching posts for user ${userId}`);
  // Simulate async operation
  await new Promise((resolve) => setTimeout(resolve, 10));
  return [
    { id: 1, title: "First Post", userId },
    { id: 2, title: "Second Post", userId },
  ];
}

const app = createApp()
  // Set up request ID tracking for all requests
  .onGlobalRequest(({ store, request }) => {
    // Generate a unique request ID
    const requestId = crypto.randomUUID();
    store.set("requestId", requestId);

    log("INFO", `Request received: ${request.method} ${request.url}`);

    // Simulate auth - in real app, you'd validate a JWT or session
    const authHeader = request.headers.get("Authorization");
    if (authHeader === "Bearer valid-token") {
      store.set("user", { id: 1, name: "John Doe" });
      log("INFO", "User authenticated");
    }
  })

  // Public health check endpoint
  .get("/health", () => {
    log("INFO", "Health check called");
    return { status: "ok" };
  })

  // Protected endpoint that requires authentication
  .get("/api/profile", () => {
    log("INFO", "Profile endpoint called");

    const user = getCurrentUser();
    if (!user) {
      log("WARN", "Unauthorized access attempt");
      return { error: "Unauthorized" };
    }

    log("INFO", `Returning profile for user ${user.id}`);
    return { user };
  })

  // Endpoint with nested function calls
  .get("/api/posts", async () => {
    log("INFO", "Posts endpoint called");

    const user = getCurrentUser();
    if (!user) {
      log("WARN", "Unauthorized access to posts");
      return { error: "Unauthorized" };
    }

    // getStore() works in nested async functions
    const posts = await fetchUserPosts(user.id);

    log("INFO", `Returning ${posts.length} posts`);
    return { posts };
  })

  // Demonstrate manual store manipulation
  .get("/api/debug", ({ store }) => {
    // You can inspect the store contents
    const allKeys = Array.from(store.keys());
    const allEntries = Array.from(store.entries());

    return {
      keys: allKeys,
      entries: allEntries,
    };
  });

// Example usage
if (import.meta.main) {
  console.log("\n🚀 Starting server with AsyncLocalStorage example\n");
  console.log("Try these requests:");
  console.log("  curl http://localhost:3001/health");
  console.log("  curl http://localhost:3001/api/profile");
  console.log('  curl -H "Authorization: Bearer valid-token" http://localhost:3001/api/profile');
  console.log('  curl -H "Authorization: Bearer valid-token" http://localhost:3001/api/posts');
  console.log('  curl -H "Authorization: Bearer valid-token" http://localhost:3001/api/debug');
  console.log();

  app.listen(3001);
}
