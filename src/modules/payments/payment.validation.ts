import { z } from 'zod';
import { PaymentStatus, PaymentMethod } from '../../generated/prisma/client.js';

const uuid = z.string().uuid('Must be a valid UUID');

export { PaymentStatus, PaymentMethod };

export const paymentIdParamSchema = z.object({
  id: uuid,
});

export const paymentQuerySchema = z.object({
  status: z.nativeEnum(PaymentStatus).optional(),
  method: z.nativeEnum(PaymentMethod).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

// Stripe is the only method wired up in this phase — the enum still
// a clear "not yet supported" error rather than pretending to process it.
export const createPaymentSchema = z.object({
  rentalOrderId: uuid,
  method: z.nativeEnum(PaymentMethod).default(PaymentMethod.STRIPE),
});

export type PaymentQueryInput = z.infer<typeof paymentQuerySchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
