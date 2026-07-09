import { Router } from 'express';
import * as gearController from './gear.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { gearQuerySchema, gearIdParamSchema } from './gear.validation.js';

const router = Router();

router.get('/', validate(gearQuerySchema, 'query'), gearController.list);
router.get('/:id', validate(gearIdParamSchema, 'params'), gearController.getById);

export default router;
