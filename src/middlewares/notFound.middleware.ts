import { NextFunction, Request, Response } from 'express';
import { NotFoundError } from '../errors/NotFoundError';

/**
 * Mounted after all route definitions. Any request that reaches this
 * point matched no route, so we turn it into a NotFoundError and let
 * the global error handler format the response consistently.
 */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
};
