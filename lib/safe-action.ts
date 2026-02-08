import { logger } from './logger';
import { contextStorage } from './context';
import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';

export type ActionState<T> = {
    data?: T;
    error?: string;
};

/**
 * Wrapper for Server Actions to provide automatic logging, error handling, Zod validation, and context injection.
 */
export function safeAction<TIn, TOut>(
    actionName: string,
    schema: z.Schema<TIn>,
    handler: (data: TIn, context: { userId?: string; teamId?: string; requestId: string }) => Promise<TOut>
) {
    return async (rawData: TIn): Promise<ActionState<TOut>> => {
        const store = contextStorage.getStore();
        const requestId = store?.requestId || 'internal-' + Math.random().toString(36).substring(7);

        return await contextStorage.run({ ...store, requestId, action: actionName }, async () => {
            try {
                // 1. Validation Zod
                const validation = schema.safeParse(rawData);
                if (!validation.success) {
                    const errorMessage = validation.error.issues[0].message;
                    logger.warn({ action: actionName, error: errorMessage, validationErrors: validation.error.issues }, `Validation failed: ${actionName}`);
                    return { error: errorMessage };
                }
                const data = validation.data;

                const supabase = await createClient();
                const { data: { user } } = await supabase.auth.getUser();

                const userId = user?.id;
                const teamId = store?.teamId;

                logger.info({ action: actionName, userId, teamId }, `Action started: ${actionName}`);

                const result = await handler(data, { userId, teamId, requestId });

                logger.info({ action: actionName, userId, teamId }, `Action success: ${actionName}`);

                return { data: result };
            } catch (error: any) {
                logger.error(
                    {
                        action: actionName,
                        error: error.message,
                        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
                    },
                    `Action failed: ${actionName}`
                );

                return { error: error.message || 'An unexpected error occurred' };
            }
        });
    };
}
