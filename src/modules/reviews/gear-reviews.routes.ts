import { Router } from 'express';
import * as reviewController from './review.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { gearIdParamSchema, reviewQuerySchema } from './review.validation.js';

const router = Router({ mergeParams: true });

router.get(
  '/',
  validate(gearIdParamSchema, 'params'),
  validate(reviewQuerySchema, 'query'),
  reviewController.listForGear,
);

export default router;
