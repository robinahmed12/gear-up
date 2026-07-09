import { Router } from 'express';
import * as userController from './user.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { verifyTokenMiddleware } from '../../middlewares/auth.middleware.js';
import { verifyRole } from '../../middlewares/role.middleware.js';
import { Role } from '../../constants/roles.js';
import { userIdParamSchema, userQuerySchema, updateUserStatusSchema } from './user.validation.js';

const router = Router();

// Every route in this file requires an ADMIN token — applied once here
// rather than repeated per-route, matching the provider-gear pattern.
router.use(verifyTokenMiddleware, verifyRole(Role.ADMIN));

router.get('/', validate(userQuerySchema, 'query'), userController.list);
router.patch(
  '/:id',
  validate(userIdParamSchema, 'params'),
  validate(updateUserStatusSchema),
  userController.updateStatus,
);

export default router;
