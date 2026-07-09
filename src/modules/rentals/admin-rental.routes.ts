import { Router } from 'express';
import * as rentalController from './rental.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { verifyTokenMiddleware } from '../../middlewares/auth.middleware.js';
import { verifyRole } from '../../middlewares/role.middleware.js';
import { Role } from '../../constants/roles.js';
import { rentalIdParamSchema, adminRentalQuerySchema } from './rental.validation.js';

const router = Router();

// Every route in this file requires an ADMIN token — applied once here
// rather than repeated per-route, matching the provider-order pattern.
router.use(verifyTokenMiddleware, verifyRole(Role.ADMIN));

router.get('/', validate(adminRentalQuerySchema, 'query'), rentalController.listAllForAdmin);
// getById reuses the same handler customers/providers hit — it already
// grants access when the requester's role is ADMIN, on top of the
// ownership check used for the other two roles.
router.get('/:id', validate(rentalIdParamSchema, 'params'), rentalController.getById);

export default router;
