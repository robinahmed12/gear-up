import { Role } from '../generated/prisma/client.js';

// Extends Express's Request type so `req.user` is available and typed
// after the auth middleware runs, without needing `as any` casts
// throughout controllers.
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
      };
    }
  }
}

export {};
