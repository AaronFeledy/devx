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
export declare const logger: Logger;
export declare const createPrefixedLogger: (prefix: string) => Logger;
