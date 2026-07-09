import { Router } from 'express';
import * as gearController from './gear.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { verifyTokenMiddleware } from '../../middlewares/auth.middleware.js';
import { verifyRole } from '../../middlewares/role.middleware.js';
import { Role } from '../../constants/roles.js';
import {
  createGearSchema,
  updateGearSchema,
  gearIdParamSchema,
  gearQuerySchema,
} from './gear.validation.js';

const router = Router();

// Every route in this file requires a PROVIDER token — applied once here
// rather than repeated per-route.
router.use(verifyTokenMiddleware, verifyRole(Role.PROVIDER));

router.get('/', validate(gearQuerySchema, 'query'), gearController.listOwn);
router.post('/', validate(createGearSchema), gearController.create);
router.put(
  '/:id',
  validate(gearIdParamSchema, 'params'),
  validate(updateGearSchema),
  gearController.update,
);
router.delete('/:id', validate(gearIdParamSchema, 'params'), gearController.remove);

export default router;
