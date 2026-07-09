import { z } from 'zod';
import { Role } from '../../constants/roles.js';
import { UserStatus } from '../../generated/prisma/client.js';

const uuid = z.string().uuid('Must be a valid UUID');

export { UserStatus };

export const userIdParamSchema = z.object({
  id: uuid,
});

export const userQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  role: z.nativeEnum(Role).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

// Only these two values are ever settable through the admin endpoint —
// built from z.nativeEnum() (rather than z.enum(['ACTIVE', 'SUSPENDED']))
// so the inferred TS type is the real UserStatus enum, matching what
// Prisma expects in the update call without an extra cast.
export const updateUserStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

export type UserQueryInput = z.infer<typeof userQuerySchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
