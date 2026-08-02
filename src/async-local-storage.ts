import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Internal AsyncLocalStorage instance for storing per-request context data.
 * @private
 */
export const asyncLocalStorage = new AsyncLocalStorage<Map<string, any>>();

/**
 * Store for managing per-request data using AsyncLocalStorage.
 *
 * This allows you to store and retrieve data anywhere in the call stack
 * without explicitly passing it through function parameters.
 *
 * @example
 * ```ts
 * import { createApp } from "@aklinker1/zeta";
 *
 * const app = createApp()
 *   .onGlobalRequest(({ store }) => {
 *     // Set a request ID that can be accessed anywhere
 *     store.set("requestId", crypto.randomUUID());
 *   })
 *   .get("/test", () => {
 *     // Access the request ID in the handler
 *     const requestId = getStore().get("requestId");
 *     console.log("Request ID:", requestId);
 *     return { requestId };
 *   });
 * ```
 */
export interface Store {
  /**
   * Get a value from the store by key.
   *
   * @param key - The key to retrieve
   * @returns The stored value, or undefined if not found
   *
   * @example
   * ```ts
   * const requestId = store.get("requestId");
   * ```
   */
  get<T = any>(key: string): T | undefined;

  /**
   * Set a value in the store.
   *
   * @param key - The key to store the value under
   * @param value - The value to store
   *
   * @example
   * ```ts
   * store.set("requestId", "abc-123");
   * store.set("user", { id: 1, name: "John" });
   * ```
   */
  set<T = any>(key: string, value: T): void;

  /**
   * Check if a key exists in the store.
   *
   * @param key - The key to check
   * @returns true if the key exists, false otherwise
   *
   * @example
   * ```ts
   * if (store.has("requestId")) {
   *   console.log("Request ID is set");
   * }
   * ```
   */
  has(key: string): boolean;

  /**
   * Delete a value from the store.
   *
   * @param key - The key to delete
   * @returns true if the key was deleted, false if it didn't exist
   *
   * @example
   * ```ts
   * store.delete("temporaryData");
   * ```
   */
  delete(key: string): boolean;

  /**
   * Clear all values from the store.
   *
   * @example
   * ```ts
   * store.clear();
   * ```
   */
  clear(): void;

  /**
   * Get all keys in the store.
   *
   * @returns An iterator of all keys
   *
   * @example
   * ```ts
   * for (const key of store.keys()) {
   *   console.log(key, store.get(key));
   * }
   * ```
   */
  keys(): IterableIterator<string>;

  /**
   * Get all values in the store.
   *
   * @returns An iterator of all values
   *
   * @example
   * ```ts
   * for (const value of store.values()) {
   *   console.log(value);
   * }
   * ```
   */
  values(): IterableIterator<any>;

  /**
   * Get all entries in the store.
   *
   * @returns An iterator of all [key, value] pairs
   *
   * @example
   * ```ts
   * for (const [key, value] of store.entries()) {
   *   console.log(key, value);
   * }
   * ```
   */
  entries(): IterableIterator<[string, any]>;
}

/**
 * Get the current request's store.
 *
 * This function can be called anywhere in the call stack during request handling
 * to access the AsyncLocalStorage store for the current request.
 *
 * @returns The store for the current request
 * @throws {Error} If called outside of a request context
 *
 * @example
 * ```ts
 * import { getStore } from "@aklinker1/zeta";
 *
 * function someUtilityFunction() {
 *   const store = getStore();
 *   const requestId = store.get("requestId");
 *   console.log("Processing request:", requestId);
 * }
 *
 * const app = createApp()
 *   .onGlobalRequest(({ store }) => {
 *     store.set("requestId", crypto.randomUUID());
 *   })
 *   .get("/test", () => {
 *     someUtilityFunction(); // Can access store anywhere
 *     return "OK";
 *   });
 * ```
 */
export function getStore(): Store {
  const store = asyncLocalStorage.getStore();
  if (!store) {
    throw new Error(
      "getStore() called outside of request context. Make sure you're calling this during request handling.",
    );
  }
  return createStoreProxy(store);
}

/**
 * Create a Store proxy object from a Map.
 * @private
 */
function createStoreProxy(map: Map<string, any>): Store {
  return {
    get: (key: string) => map.get(key),
    set: (key: string, value: any) => {
      map.set(key, value);
    },
    has: (key: string) => map.has(key),
    delete: (key: string) => map.delete(key),
    clear: () => map.clear(),
    keys: () => map.keys(),
    values: () => map.values(),
    entries: () => map.entries(),
  };
}

/**
 * Create a Store instance for a new request.
 * @private
 */
export function createStore(map?: Map<string, any>): Store {
  return createStoreProxy(map ?? new Map());
}
