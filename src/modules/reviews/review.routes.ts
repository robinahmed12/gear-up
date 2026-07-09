import { Router } from 'express';
import * as reviewController from './review.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { verifyTokenMiddleware } from '../../middlewares/auth.middleware.js';
import { verifyRole } from '../../middlewares/role.middleware.js';
import { Role } from '../../constants/roles.js';
import { createReviewSchema } from './review.validation.js';

const router = Router();

router.post(
  '/',
  verifyTokenMiddleware,
  verifyRole(Role.CUSTOMER),
  validate(createReviewSchema),
  reviewController.create,
);

export default router;
