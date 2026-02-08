import { AsyncLocalStorage } from 'async_hooks';

export type RequestContext = {
    requestId: string;
    userId?: string;
    teamId?: string;
    route?: string;
    action?: string;
};

export const contextStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Returns the current request context or an empty object if called outside of a request.
 */
export function getRequestContext(): RequestContext {
    return contextStorage.getStore() || { requestId: 'unknown' };
}
