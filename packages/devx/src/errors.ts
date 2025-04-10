/**
 * Base error class for DevX core operations.
 */
export class DevxCoreError extends Error {
  public cause?: unknown;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'DevxCoreError';
    this.cause = options?.cause;

    // Maintains proper stack trace (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DevxCoreError);
    }
  }
}
