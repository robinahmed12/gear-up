import { Router } from 'express';
import * as paymentController from './payment.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { verifyTokenMiddleware } from '../../middlewares/auth.middleware.js';
import { verifyRole } from '../../middlewares/role.middleware.js';
import { Role } from '../../constants/roles.js';
import { paymentIdParamSchema, paymentQuerySchema } from './payment.validation.js';

const router = Router();

// Every route in this file requires an ADMIN token — applied once here
// rather than repeated per-route, matching the provider-gear pattern.
router.use(verifyTokenMiddleware, verifyRole(Role.ADMIN));

router.get('/', validate(paymentQuerySchema, 'query'), paymentController.listAll);
router.get('/:id', validate(paymentIdParamSchema, 'params'), paymentController.getById);

export default router;
