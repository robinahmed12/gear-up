import { Router } from 'express';
import * as authController from './auth.controller';
import { validate } from '../../middlewares/validate.middleware';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from './auth.validation';
import { verifyTokenMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', verifyTokenMiddleware, authController.getMe);
router.patch(
  '/me',
  verifyTokenMiddleware,
  validate(updateProfileSchema),
  authController.updateProfile,
);
router.patch(
  '/me/password',
  verifyTokenMiddleware,
  validate(changePasswordSchema),
  authController.changePassword,
);

export default router;
