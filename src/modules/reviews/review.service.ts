import { Prisma, RentalStatus } from '../../generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ForbiddenError } from '../../errors/ForbiddenError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import {
  getPrismaPagination,
  buildPaginationMeta,
  PaginationMeta,
} from '../../utils/pagination.js';
import { CreateReviewInput, ReviewQueryInput } from './review.validation.js';

const reviewSelect = {
  id: true,
  rating: true,
  comment: true,
  createdAt: true,
  updatedAt: true,
  customerId: true,
  customer: { select: { id: true, name: true } },
  gearId: true,
  rentalOrderId: true,
} satisfies Prisma.ReviewSelect;

/**
 * Recomputes Gear.averageRating / Gear.reviewCount from the live set of
 * reviews for that gear item. Called inside the same transaction as every
 * review write (create/update/delete) so the denormalized columns on
 * Gear never drift out of sync with the actual review rows — there is
 * no code path that writes a Review without also refreshing these.
 */
const recalculateGearRating = async (
  tx: Prisma.TransactionClient,
  gearId: string,
): Promise<void> => {
  const aggregate = await tx.review.aggregate({
    where: { gearId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await tx.gear.update({
    where: { id: gearId },
    data: {
      averageRating: aggregate._avg.rating ?? 0,
      reviewCount: aggregate._count.rating,
    },
  });
};

/**
 * Guards enforced, in order:
 * 1. The rental order exists.
 * 2. It belongs to the requesting customer (not just any customer).
 * 3. Its status is RETURNED — you can't review gear you never actually
 *    completed a rental of.
 * 4. No review already exists for this specific rental order — the
 *    schema's @@unique([customerId, gearId]) is the last line of
 *    defense, but rentalOrderId is checked explicitly first so a repeat
 *    request gets a clear, specific error message instead of a raw
 *    Prisma P2002 constraint failure.
 */
export const createReview = async (customerId: string, input: CreateReviewInput) => {
  const order = await prisma.rentalOrder.findUnique({
    where: { id: input.rentalOrderId },
    select: {
      id: true,
      status: true,
      customerId: true,
      gearId: true,
      review: { select: { id: true } },
    },
  });

  if (!order) {
    throw new NotFoundError('Rental order not found');
  }

  if (order.customerId !== customerId) {
    throw new ForbiddenError('You can only review your own rental orders');
  }

  if (order.status !== RentalStatus.RETURNED) {
    throw new ConflictError(
      `You can only review a rental after it has been returned. This order is currently ${order.status}`,
    );
  }

  if (order.review) {
    throw new ConflictError('This rental order has already been reviewed');
  }

  return prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        customerId,
        gearId: order.gearId,
        rentalOrderId: order.id,
        rating: input.rating,
        comment: input.comment,
      },
      select: reviewSelect,
    });

    await recalculateGearRating(tx, order.gearId);

    return review;
  });
};

export const getReviewsForGear = async (
  gearId: string,
  query: ReviewQueryInput,
): Promise<{ items: unknown[]; meta: PaginationMeta }> => {
  const gear = await prisma.gear.findUnique({ where: { id: gearId }, select: { id: true } });
  if (!gear) {
    throw new NotFoundError('Gear item not found');
  }

  const where: Prisma.ReviewWhereInput = { gearId };
  const { skip, take } = getPrismaPagination(query);

  const [items, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: reviewSelect,
    }),
    prisma.review.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(query, total) };
};
