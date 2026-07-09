import { Router } from 'express';
import * as categoryController from './category.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { verifyTokenMiddleware } from '../../middlewares/auth.middleware.js';
import { verifyRole } from '../../middlewares/role.middleware.js';
import { Role } from '../../constants/roles.js';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema,
} from './category.validation.js';

const router = Router();

// Every route in this file requires an ADMIN token — applied once here
// rather than repeated per-route, matching the provider-gear pattern.
router.use(verifyTokenMiddleware, verifyRole(Role.ADMIN));

router.get('/', categoryController.list);
router.get('/:id', validate(categoryIdParamSchema, 'params'), categoryController.getById);
router.post('/', validate(createCategorySchema), categoryController.create);
router.put(
  '/:id',
  validate(categoryIdParamSchema, 'params'),
  validate(updateCategorySchema),
  categoryController.update,
);
router.delete('/:id', validate(categoryIdParamSchema, 'params'), categoryController.remove);

export default router;
