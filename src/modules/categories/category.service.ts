import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { CreateCategoryInput, UpdateCategoryInput } from './category.validation.js';

// _count.gearItems lets the admin panel show "12 gear items" next to a
// category without a separate query, and doubles as the pre-delete signal
// (see deleteCategory) for a friendlier error than the raw P2003 the DB
// would otherwise throw via the Restrict FK constraint.
const categorySelect = {
  id: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { gearItems: true } },
} satisfies Prisma.CategorySelect;

export const listCategories = async () => {
  return prisma.category.findMany({
    orderBy: { name: 'asc' },
    select: categorySelect,
  });
};

export const getCategoryById = async (id: string) => {
  const category = await prisma.category.findUnique({ where: { id }, select: categorySelect });

  if (!category) {
    throw new NotFoundError('Category not found');
  }

  return category;
};

export const createCategory = async (input: CreateCategoryInput) => {
  return prisma.category.create({
    data: input,
    select: categorySelect,
  });
};

export const updateCategory = async (id: string, input: UpdateCategoryInput) => {
  await getCategoryById(id);

  return prisma.category.update({
    where: { id },
    data: input,
    select: categorySelect,
  });
};

/**
 * Blocks the delete up front with a clear, actionable message if gear is
 * still attached, rather than letting the request fall through to the
 * DB's Restrict constraint and surface as a generic "invalid reference"
 * error from the global error handler.
 */
export const deleteCategory = async (id: string): Promise<void> => {
  const category = await getCategoryById(id);

  if (category._count.gearItems > 0) {
    throw new ConflictError(
      `Cannot delete category "${category.name}" — ${category._count.gearItems} gear item(s) are still assigned to it. Reassign or remove them first.`,
    );
  }

  await prisma.category.delete({ where: { id } });
};
