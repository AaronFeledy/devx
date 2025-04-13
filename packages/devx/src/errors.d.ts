/**
 * Base error class for DevX core operations.
 */
export declare class DevxCoreError extends Error {
    cause?: unknown;
    constructor(message: string, options?: {
        cause?: unknown;
    });
}
