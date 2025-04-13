/**
 * Basic logger interface.
 * Can be replaced with a more sophisticated logger like pino or winston.
 */
const createLogger = (prefix = 'DevX') => {
    // Simple timestamp function
    const timestamp = () => new Date().toISOString();
    return {
        info: (...args) => console.log(`[${timestamp()}] [${prefix}] [INFO]`, ...args),
        warn: (...args) => console.warn(`[${timestamp()}] [${prefix}] [WARN]`, ...args),
        error: (...args) => console.error(`[${timestamp()}] [${prefix}] [ERROR]`, ...args),
        // Debug logs only show if DEBUG env var is set (e.g., DEBUG=true)
        debug: (...args) => {
            if (process.env.DEBUG === 'true') {
                console.debug(`[${timestamp()}] [${prefix}] [DEBUG]`, ...args);
            }
        },
    };
};
export const logger = createLogger();
export const createPrefixedLogger = (prefix) => {
    return createLogger(prefix);
};
