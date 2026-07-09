import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ForbiddenError } from '../../errors/ForbiddenError.js';
import {
  getPrismaPagination,
  buildPaginationMeta,
  PaginationMeta,
} from '../../utils/pagination.js';
import {
  CreateGearInput,
  UpdateGearInput,
  GearQueryInput,
  AdminGearQueryInput,
} from './gear.validation.js';

const gearListSelect = {
  id: true,
  title: true,
  description: true,
  brand: true,
  pricePerDay: true,
  stock: true,
  isAvailable: true,
  images: true,
  averageRating: true,
  reviewCount: true,
  createdAt: true,
  updatedAt: true,
  categoryId: true,
  category: { select: { id: true, name: true } },
  providerId: true,
  provider: { select: { id: true, name: true } },
} satisfies Prisma.GearSelect;

/**
 * Builds the Prisma `where` clause for the public gear listing from
 * validated query params. Kept separate from the main list function so
 * it's independently readable/testable.
 */
const buildGearWhere = (query: GearQueryInput): Prisma.GearWhereInput => {
  const where: Prisma.GearWhereInput = {};

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { brand: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  if (query.categoryId) {
    where.categoryId = query.categoryId;
  }

  if (query.isAvailable !== undefined) {
    where.isAvailable = query.isAvailable;
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.pricePerDay = {
      ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
      ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
    };
  }

  return where;
};

const buildGearOrderBy = (
  sortBy: GearQueryInput['sortBy'],
  sortOrder: GearQueryInput['sortOrder'],
): Prisma.GearOrderByWithRelationInput => {
  switch (sortBy) {
    case 'price':
      return { pricePerDay: sortOrder };
    case 'rating':
      return { averageRating: sortOrder };
    case 'newest':
    default:
      return { createdAt: sortOrder };
  }
};

export const listGear = async (
  query: GearQueryInput,
): Promise<{ items: unknown[]; meta: PaginationMeta }> => {
  const where = buildGearWhere(query);
  const orderBy = buildGearOrderBy(query.sortBy, query.sortOrder);
  const { skip, take } = getPrismaPagination(query);

  const [items, total] = await Promise.all([
    prisma.gear.findMany({ where, orderBy, skip, take, select: gearListSelect }),
    prisma.gear.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(query, total) };
};

export const getGearById = async (id: string) => {
  const gear = await prisma.gear.findUnique({ where: { id }, select: gearListSelect });

  if (!gear) {
    throw new NotFoundError('Gear item not found');
  }

  return gear;
};

/**
 * Confirms the category exists before creating gear against it — without
 * this check, a bad categoryId would surface as an opaque Prisma P2003
 * foreign-key error instead of a clear validation message.
 */
const assertCategoryExists = async (categoryId: string): Promise<void> => {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    throw new NotFoundError('Category not found');
  }
};

export const createGear = async (providerId: string, input: CreateGearInput) => {
  await assertCategoryExists(input.categoryId);

  return prisma.gear.create({
    data: { ...input, providerId },
    select: gearListSelect,
  });
};

/**
 * Shared ownership guard for update/delete: fetches the gear and throws
 * NotFoundError if it doesn't exist, or ForbiddenError if it exists but
 * belongs to a different provider. Distinguishing 404 vs 403 (rather than
 * always 404) gives honest feedback without leaking *other providers'*
 * gear IDs as a side channel — the requester already knows the ID since
 * they supplied it.
 */
const assertOwnership = async (gearId: string, providerId: string): Promise<void> => {
  const gear = await prisma.gear.findUnique({
    where: { id: gearId },
    select: { providerId: true },
  });

  if (!gear) {
    throw new NotFoundError('Gear item not found');
  }

  if (gear.providerId !== providerId) {
    throw new ForbiddenError('You can only manage gear you own');
  }
};

export const updateGear = async (gearId: string, providerId: string, input: UpdateGearInput) => {
  await assertOwnership(gearId, providerId);

  if (input.categoryId) {
    await assertCategoryExists(input.categoryId);
  }

  return prisma.gear.update({
    where: { id: gearId },
    data: input,
    select: gearListSelect,
  });
};

export const deleteGear = async (gearId: string, providerId: string): Promise<void> => {
  await assertOwnership(gearId, providerId);

  await prisma.gear.delete({ where: { id: gearId } });
};

export const listProviderGear = async (providerId: string, query: GearQueryInput) => {
  const where: Prisma.GearWhereInput = { ...buildGearWhere(query), providerId };
  const orderBy = buildGearOrderBy(query.sortBy, query.sortOrder);
  const { skip, take } = getPrismaPagination(query);

  const [items, total] = await Promise.all([
    prisma.gear.findMany({ where, orderBy, skip, take, select: gearListSelect }),
    prisma.gear.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(query, total) };
};

/**
 * Platform-wide gear oversight for admins — no ownership scoping, unlike
 * listProviderGear which is always filtered down to "mine". Admins can
 * additionally slice by provider, and (unlike the public listing) can
 * see unavailable/out-of-stock gear by simply omitting isAvailable.
 */
export const listGearForAdmin = async (
  query: AdminGearQueryInput,
): Promise<{ items: unknown[]; meta: PaginationMeta }> => {
  const where: Prisma.GearWhereInput = {
    ...buildGearWhere(query),
    ...(query.providerId ? { providerId: query.providerId } : {}),
  };
  const orderBy = buildGearOrderBy(query.sortBy, query.sortOrder);
  const { skip, take } = getPrismaPagination(query);

  const [items, total] = await Promise.all([
    prisma.gear.findMany({ where, orderBy, skip, take, select: gearListSelect }),
    prisma.gear.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(query, total) };
};
