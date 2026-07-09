import { Router } from 'express';
import * as gearController from './gear.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { verifyTokenMiddleware } from '../../middlewares/auth.middleware.js';
import { verifyRole } from '../../middlewares/role.middleware.js';
import { Role } from '../../constants/roles.js';
import { adminGearQuerySchema, gearIdParamSchema } from './gear.validation.js';

const router = Router();

// Every route in this file requires an ADMIN token — applied once here
// rather than repeated per-route, matching the provider-gear pattern.
router.use(verifyTokenMiddleware, verifyRole(Role.ADMIN));

router.get('/', validate(adminGearQuerySchema, 'query'), gearController.listAllForAdmin);
// getById reuses the same public detail handler — gear details aren't
// ownership-scoped, so there's nothing admin-specific about fetching one.
router.get('/:id', validate(gearIdParamSchema, 'params'), gearController.getById);

export default router;
