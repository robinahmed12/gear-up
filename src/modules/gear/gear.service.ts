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
 * Utility: buildGearWhere
 * -----------------------
 * Constructs the Prisma `where` clause for public gear listings.
 * - Supports search by title/brand.
 * - Filters by category, availability, and price range.
 * - Kept separate for readability and testability.
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

/**
 * Utility: buildGearOrderBy
 * -------------------------
 * Maps sort options to Prisma `orderBy` clauses.
 * - Supports sorting by price, rating, or newest.
 */
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

/**
 * Service: listGear
 * -----------------
 * Public gear listing with pagination, filtering, and sorting.
 */
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

/**
 * Service: getGearById
 * --------------------
 * Retrieves a single gear item by ID.
 * - Throws NotFoundError if gear does not exist.
 */
export const getGearById = async (id: string) => {
  const gear = await prisma.gear.findUnique({ where: { id }, select: gearListSelect });

  if (!gear) {
    throw new NotFoundError('Gear item not found');
  }

  return gear;
};

/**
 * Utility: assertCategoryExists
 * -----------------------------
 * Ensures the category exists before creating/updating gear.
 * - Prevents opaque Prisma foreign-key errors (P2003).
 */
const assertCategoryExists = async (categoryId: string): Promise<void> => {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    throw new NotFoundError('Category not found');
  }
};

/**
 * Service: createGear
 * -------------------
 * Creates a new gear item for a provider.
 * - Validates category existence.
 */
export const createGear = async (providerId: string, input: CreateGearInput) => {
  await assertCategoryExists(input.categoryId);

  return prisma.gear.create({
    data: { ...input, providerId },
    select: gearListSelect,
  });
};

/**
 * Utility: assertOwnership
 * ------------------------
 * Ownership guard for update/delete operations.
 * - Throws NotFoundError if gear does not exist.
 * - Throws ForbiddenError if gear belongs to another provider.
 * - Distinguishes 404 vs 403 for honest feedback without leaking IDs.
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

/**
 * Service: updateGear
 * -------------------
 * Updates an existing gear item.
 * - Validates ownership and category existence.
 */
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

/**
 * Service: deleteGear
 * -------------------
 * Deletes a gear item.
 * - Validates ownership before deletion.
 */
export const deleteGear = async (gearId: string, providerId: string): Promise<void> => {
  await assertOwnership(gearId, providerId);

  await prisma.gear.delete({ where: { id: gearId } });
};

/**
 * Service: listProviderGear
 * -------------------------
 * Lists gear items belonging to a specific provider.
 * - Scoped by providerId.
 * - Supports filtering, sorting, and pagination.
 */
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
 * Service: listGearForAdmin
 * -------------------------
 * Platform-wide gear listing for admins.
 * - No ownership scoping (admins can view all gear).
 * - Supports filtering by providerId.
 * - Unlike public listing, includes unavailable/out-of-stock gear.
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
