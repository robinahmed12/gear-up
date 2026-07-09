import { NextFunction, Request, Response } from 'express';
import { Role } from '../constants/roles.js';
import { ForbiddenError } from '../errors/ForbiddenError';
import { UnauthorizedError } from '../errors/UnauthorizedError';

/**
 * Restricts a route to one or more roles. Must run AFTER
 * verifyTokenMiddleware, since it reads req.user set there.
 *
 * Usage:
 *   router.post('/provider/gear', verifyTokenMiddleware, verifyRole('PROVIDER'), ...)
 *   router.get('/admin/users', verifyTokenMiddleware, verifyRole('ADMIN'), ...)
 */
export const verifyRole = (...allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required before role check');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError(`Access denied. Required role(s): ${allowedRoles.join(', ')}`);
    }

    next();
  };
};
