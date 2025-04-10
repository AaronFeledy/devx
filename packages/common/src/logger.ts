/**
 * Basic logger interface.
 * Can be replaced with a more sophisticated logger like pino or winston.
 */

export interface Logger {
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  debug: (...args: any[]) => void;
}

const createLogger = (prefix = 'DevX'): Logger => {
  // Simple timestamp function
  const timestamp = () => new Date().toISOString();

  return {
    info: (...args: any[]) =>
      console.log(`[${timestamp()}] [${prefix}] [INFO]`, ...args),
    warn: (...args: any[]) =>
      console.warn(`[${timestamp()}] [${prefix}] [WARN]`, ...args),
    error: (...args: any[]) =>
      console.error(`[${timestamp()}] [${prefix}] [ERROR]`, ...args),
    // Debug logs only show if DEBUG env var is set (e.g., DEBUG=true)
    debug: (...args: any[]) => {
      if (process.env.DEBUG === 'true') {
        console.debug(`[${timestamp()}] [${prefix}] [DEBUG]`, ...args);
      }
    },
  };
};

export const logger = createLogger();

export const createPrefixedLogger = (prefix: string): Logger => {
  return createLogger(prefix);
};
