import { Prisma, Role } from '../../generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ForbiddenError } from '../../errors/ForbiddenError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { RentalStatus, assertValidTransition } from '../../constants/orderStatus.js';
import { calculateTotalDays } from '../../utils/rentalDates.js';
import {
  getPrismaPagination,
  buildPaginationMeta,
  PaginationMeta,
} from '../../utils/pagination.js';
import {
  CreateRentalInput,
  RentalQueryInput,
  UpdateRentalStatusInput,
  AdminRentalQueryInput,
} from './rental.validation.js';

const rentalSelect = {
  id: true,
  quantity: true,
  startDate: true,
  endDate: true,
  totalDays: true,
  pricePerDay: true,
  totalAmount: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  customerId: true,
  customer: { select: { id: true, name: true, email: true } },
  gearId: true,
  gear: {
    select: {
      id: true,
      title: true,
      images: true,
      providerId: true,
      provider: { select: { id: true, name: true } },
    },
  },
  payment: { select: { id: true, status: true, method: true } },
} satisfies Prisma.RentalOrderSelect;

export const createRentalOrder = async (customerId: string, input: CreateRentalInput) => {
  const gear = await prisma.gear.findUnique({
    where: { id: input.gearId },
    select: { id: true, pricePerDay: true, isAvailable: true, stock: true },
  });

  if (!gear) {
    throw new NotFoundError('Gear item not found');
  }

  if (!gear.isAvailable) {
    throw new ConflictError('This gear item is currently unavailable for rental');
  }

  const totalDays = calculateTotalDays(input.startDate, input.endDate);
  const pricePerDay = gear.pricePerDay;
  const totalAmount = Number(pricePerDay) * input.quantity * totalDays;

  // The atomic guard against overselling: `updateMany` with `stock: { gte:
  // quantity }` in the WHERE clause is evaluated by Postgres as a single
  // atomic operation. If two customers race for the last unit, only one
  // update's WHERE clause will still match by the time it executes — the
  // other gets `count: 0` and a clean ConflictError, with no explicit row
  // locking or SELECT-then-UPDATE race condition required.
  return prisma.$transaction(async (tx) => {
    const stockUpdate = await tx.gear.updateMany({
      where: { id: input.gearId, stock: { gte: input.quantity }, isAvailable: true },
      data: { stock: { decrement: input.quantity } },
    });

    if (stockUpdate.count === 0) {
      throw new ConflictError('Not enough stock available for the requested quantity');
    }

    const order = await tx.rentalOrder.create({
      data: {
        customerId,
        gearId: input.gearId,
        quantity: input.quantity,
        startDate: input.startDate,
        endDate: input.endDate,
        totalDays,
        pricePerDay,
        totalAmount,
        status: RentalStatus.PLACED,
      },
      select: rentalSelect,
    });

    return order;
  });
};

export const getCustomerRentals = async (
  customerId: string,
  query: RentalQueryInput,
): Promise<{ items: unknown[]; meta: PaginationMeta }> => {
  const where: Prisma.RentalOrderWhereInput = {
    customerId,
    ...(query.status ? { status: query.status } : {}),
  };
  const { skip, take } = getPrismaPagination(query);

  const [items, total] = await Promise.all([
    prisma.rentalOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: rentalSelect,
    }),
    prisma.rentalOrder.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(query, total) };
};

export const getProviderOrders = async (
  providerId: string,
  query: RentalQueryInput,
): Promise<{ items: unknown[]; meta: PaginationMeta }> => {
  const where: Prisma.RentalOrderWhereInput = {
    gear: { providerId },
    ...(query.status ? { status: query.status } : {}),
  };
  const { skip, take } = getPrismaPagination(query);

  const [items, total] = await Promise.all([
    prisma.rentalOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: rentalSelect,
    }),
    prisma.rentalOrder.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(query, total) };
};

/**
 * Platform-wide rental oversight for admins — no ownership scoping,
 * unlike getCustomerRentals/getProviderOrders which are always filtered
 * down to "mine". Admins can additionally slice by customer or provider.
 */
export const getAllRentalsForAdmin = async (
  query: AdminRentalQueryInput,
): Promise<{ items: unknown[]; meta: PaginationMeta }> => {
  const where: Prisma.RentalOrderWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.customerId ? { customerId: query.customerId } : {}),
    ...(query.providerId ? { gear: { providerId: query.providerId } } : {}),
  };
  const { skip, take } = getPrismaPagination(query);

  const [items, total] = await Promise.all([
    prisma.rentalOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: rentalSelect,
    }),
    prisma.rentalOrder.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(query, total) };
};

/**
 * Fetches a single order and verifies the requester is either the
 * customer who placed it or the provider who owns the underlying gear.
 * Anyone else gets ForbiddenError, even with a valid token.
 */
export const getRentalByIdForUser = async (
  orderId: string,
  requester: { id: string; role: Role },
) => {
  const order = await prisma.rentalOrder.findUnique({
    where: { id: orderId },
    select: rentalSelect,
  });

  if (!order) {
    throw new NotFoundError('Rental order not found');
  }

  const isOwningCustomer = order.customerId === requester.id;
  const isOwningProvider = order.gear.providerId === requester.id;

  if (!isOwningCustomer && !isOwningProvider && requester.role !== Role.ADMIN) {
    throw new ForbiddenError('You do not have access to this rental order');
  }

  return order;
};

export const updateOrderStatus = async (
  orderId: string,
  providerId: string,
  input: UpdateRentalStatusInput,
) => {
  const order = await prisma.rentalOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      quantity: true,
      gearId: true,
      gear: { select: { providerId: true } },
    },
  });

  if (!order) {
    throw new NotFoundError('Rental order not found');
  }

  if (order.gear.providerId !== providerId) {
    throw new ForbiddenError('You can only manage orders for gear you own');
  }

  assertValidTransition(order.status, input.status);

  // Returning the gear makes its stock available again for future orders.
  // Everything else is a plain status update with no side effects.
  if (input.status === 'RETURNED') {
    return prisma.$transaction(async (tx) => {
      await tx.gear.update({
        where: { id: order.gearId },
        data: { stock: { increment: order.quantity } },
      });

      return tx.rentalOrder.update({
        where: { id: orderId },
        data: { status: RentalStatus.RETURNED },
        select: rentalSelect,
      });
    });
  }

  return prisma.rentalOrder.update({
    where: { id: orderId },
    data: { status: input.status },
    select: rentalSelect,
  });
};

/**
 * Called only by the Payments module's Stripe webhook handler once a
 * PaymentIntent succeeds — never by a customer or provider action
 * directly, which is why this takes no requester/ownership argument
 * unlike every other mutation in this file. assertValidTransition still
 * guards it: a webhook retry against an order that's already PAID (or
 * further along) fails loudly instead of silently double-processing.
 */
export const markOrderAsPaid = async (orderId: string) => {
  const order = await prisma.rentalOrder.findUnique({
    where: { id: orderId },
    select: { id: true, status: true },
  });

  if (!order) {
    throw new NotFoundError('Rental order not found');
  }

  assertValidTransition(order.status, RentalStatus.PAID);

  return prisma.rentalOrder.update({
    where: { id: orderId },
    data: { status: RentalStatus.PAID },
    select: rentalSelect,
  });
};

export const cancelRentalOrder = async (orderId: string, customerId: string) => {
  const order = await prisma.rentalOrder.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, quantity: true, gearId: true, customerId: true },
  });

  if (!order) {
    throw new NotFoundError('Rental order not found');
  }

  if (order.customerId !== customerId) {
    throw new ForbiddenError('You can only cancel your own rental orders');
  }

  assertValidTransition(order.status, RentalStatus.CANCELLED);

  return prisma.$transaction(async (tx) => {
    await tx.gear.update({
      where: { id: order.gearId },
      data: { stock: { increment: order.quantity } },
    });

    return tx.rentalOrder.update({
      where: { id: orderId },
      data: { status: RentalStatus.CANCELLED },
      select: rentalSelect,
    });
  });
};
