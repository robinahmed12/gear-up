import { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Wraps an async controller so any rejected promise / thrown error is
 * forwarded to next(), which hands it to the global error middleware.
 * Without this, every controller would need its own try/catch.
 */
export const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
