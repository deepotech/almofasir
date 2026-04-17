/**
 * Structured logger for production monitoring (Datadog/Sentry/GCP).
 * Automatically formats output correctly for production vs development.
 */

interface LogContext {
    event: string;
    route?: string;
    userId?: string;
    durationMs?: number;
    [key: string]: any;
}

function formatLog(level: 'INFO' | 'WARN' | 'ERROR', message: string, context?: LogContext, error?: any) {
    const timestamp = new Date().toISOString();
    
    if (process.env.NODE_ENV === 'production') {
        const logEntry = {
            timestamp,
            level,
            message,
            ...context,
            error: error ? (error.message || String(error)) : undefined,
            stack: error?.stack,
        };
        return JSON.stringify(logEntry);
    } else {
        // Human-readable formats for local development
        const ctxStr = context ? ` [${context.event}]` : '';
        return `[${timestamp}] [${level}]${ctxStr} ${message} ${error ? `\nError: ${error.message || String(error)}` : ''}`;
    }
}

export const logger = {
    info: (message: string, context?: LogContext) => {
        const formatted = formatLog('INFO', message, context);
        console.log(formatted);
    },
    warn: (message: string, context?: LogContext, error?: any) => {
        const formatted = formatLog('WARN', message, context, error);
        console.warn(formatted);
    },
    error: (message: string, context?: LogContext, error?: any) => {
        const formatted = formatLog('ERROR', message, context, error);
        console.error(formatted);
    }
};
