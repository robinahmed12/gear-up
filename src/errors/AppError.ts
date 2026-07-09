/**
 * Base class for all "known" errors thrown deliberately by our own code
 * (as opposed to unexpected bugs/exceptions). The global error handler
 * checks `instanceof AppError` to decide whether it's safe to expose the
 * message directly to the client.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorDetails?: unknown;

  constructor(message: string, statusCode: number, errorDetails?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errorDetails = errorDetails;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
