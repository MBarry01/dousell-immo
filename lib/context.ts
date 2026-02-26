// Safe type for AsyncLocalStorage
interface IAsyncLocalStorage<T> {
    run<R>(store: T, callback: () => R): R;
    getStore(): T | undefined;
}

// Safe import for AsyncLocalStorage that works in both Node.js and Edge Runtime
let AsyncLocalStorageClass: any;
try {
    // Try global first (Edge Runtime / Recent Node.js)
    AsyncLocalStorageClass = (globalThis as any).AsyncLocalStorage;
} catch (e) {
    // Fallback if unavailable (should not happen in modern Next.js/Edge)
    AsyncLocalStorageClass = class {
        run(_: any, callback: any) { return callback(); }
        getStore() { return undefined; }
    };
}

export type RequestContext = {
    requestId: string;
    userId?: string;
    teamId?: string;
    route?: string;
    action?: string;
};

export const contextStorage: IAsyncLocalStorage<RequestContext> = new AsyncLocalStorageClass();

/**
 * Returns the current request context or an empty object if called outside of a request.
 */
export function getRequestContext(): RequestContext {
    return contextStorage.getStore() || { requestId: 'unknown' };
}
