import { z } from 'zod';

const uuid = z.string().uuid('Must be a valid UUID');

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().trim().max(500).optional(),
});

// All fields optional for update.
export const updateCategorySchema = createCategorySchema.partial();

export const categoryIdParamSchema = z.object({
  id: uuid,
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
