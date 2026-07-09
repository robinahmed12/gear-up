import { Role } from '../generated/prisma/client.js';

// Re-exported so modules can import roles from one place instead of
// reaching into @prisma/client everywhere. Keeps the door open to add
// role-related helpers (e.g. hierarchy checks) later without touching
// every import site.
export { Role };

export const ROLES = {
  CUSTOMER: Role.CUSTOMER,
  PROVIDER: Role.PROVIDER,
  ADMIN: Role.ADMIN,
} as const;
