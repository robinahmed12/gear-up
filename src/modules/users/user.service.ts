import { Prisma, Role } from '../../generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ForbiddenError } from '../../errors/ForbiddenError.js';
import {
  getPrismaPagination,
  buildPaginationMeta,
  PaginationMeta,
} from '../../utils/pagination.js';
import { UserQueryInput, UpdateUserStatusInput } from './user.validation.js';

// Password is deliberately excluded everywhere in this module — admin
// views never need it, and leaving it out of every select is safer than
// remembering to strip it from every response.
const userListSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  phone: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

const buildUserWhere = (query: UserQueryInput): Prisma.UserWhereInput => {
  const where: Prisma.UserWhereInput = {};

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  if (query.role) {
    where.role = query.role;
  }

  if (query.status) {
    where.status = query.status;
  }

  return where;
};

export const listUsers = async (
  query: UserQueryInput,
): Promise<{ items: unknown[]; meta: PaginationMeta }> => {
  const where = buildUserWhere(query);
  const { skip, take } = getPrismaPagination(query);

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: userListSelect,
    }),
    prisma.user.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(query, total) };
};

/**
 * Suspends or activates a user. Admin accounts are never touchable
 * through this endpoint — not even by another admin — so a compromised
 * or careless admin session can't lock every admin out of the platform,
 * and there's no risk of an admin accidentally suspending themselves.
 * Deactivating an admin, if ever needed, is a direct database operation.
 */
export const updateUserStatus = async (userId: string, input: UpdateUserStatusInput) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, status: true },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.role === Role.ADMIN) {
    throw new ForbiddenError(
      'Admin accounts cannot be suspended or activated through this endpoint',
    );
  }

  return prisma.user.update({
    where: { id: userId },
    data: { status: input.status },
    select: userListSelect,
  });
};
