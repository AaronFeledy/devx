/**
 * Base error class for DevX core operations.
 */
export class DevxCoreError extends Error {
    cause;
    constructor(message, options) {
        super(message);
        this.name = 'DevxCoreError';
        this.cause = options?.cause;
        // Maintains proper stack trace (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, DevxCoreError);
        }
    }
}
