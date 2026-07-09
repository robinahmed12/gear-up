import { Router } from 'express';
import * as categoryController from './category.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { categoryIdParamSchema } from './category.validation.js';

const router = Router();

router.get('/', categoryController.list);
router.get('/:id', validate(categoryIdParamSchema, 'params'), categoryController.getById);

export default router;
