import { z } from 'zod';

const uuid = z.string().uuid('Must be a valid UUID');

export const createReviewSchema = z.object({
  rentalOrderId: uuid,
  rating: z.coerce
    .number({ invalid_type_error: 'rating must be a number' })
    .int('rating must be a whole number')
    .min(1, 'rating must be between 1 and 5')
    .max(5, 'rating must be between 1 and 5'),
  comment: z.string().trim().max(1000, 'comment must be under 1000 characters').optional(),
});

export const gearIdParamSchema = z.object({
  id: uuid,
});

export const reviewQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type ReviewQueryInput = z.infer<typeof reviewQuerySchema>;
