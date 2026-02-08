import pino from 'pino';
import { getRequestContext } from './context';

// Configurer les champs à masquer (GDPR)
// Configurer les champs à masquer (GDPR)
const redactPaths = [
    'password',
    '*.password',
    'users[*].password',
    'email',
    '*.email',
    'users[*].email',
    'token',
    'secret',
    'authorization',
    'cookie'
];

const isDevelopment = process.env.NODE_ENV === 'development';

const logger = pino({
    level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
    redact: {
        paths: redactPaths,
        censor: '[REDACTED]'
    },
    transport: isDevelopment ? {
        target: 'pino-pretty',
        options: {
            colorize: true,
            ignore: 'pid,hostname',
            translateTime: 'HH:MM:ss Z',
        }
    } : undefined,
    // Mixin pour injecter automatiquement le contexte du requestId
    mixin() {
        return getRequestContext();
    }
});

export { logger };
