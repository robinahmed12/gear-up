import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendSuccess } from '../../utils/ApiResponse';
import * as authService from './auth.service';
import { UnauthorizedError } from '../../errors/UnauthorizedError';

// register user
export const register = catchAsync(async (req: Request, res: Response) => {
  const { user, token } = await authService.registerUser(req.body);

  sendSuccess(res, {
    statusCode: 201,
    message: 'Account created successfully',
    data: { user, token },
  });
});

// login user
export const login = catchAsync(async (req: Request, res: Response) => {
  const { user, token } = await authService.loginUser(req.body);

  sendSuccess(res, {
    statusCode: 200,
    message: 'Logged in successfully',
    data: { user, token },
  });
});

// fetched logged in user details
export const getMe = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const user = await authService.getCurrentUser(req.user.id);

  sendSuccess(res, {
    statusCode: 200,
    message: 'Current user fetched successfully',
    data: { user },
  });
});

// profile manage
export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const user = await authService.updateProfile(req.user.id, req.body);

  sendSuccess(res, {
    message: 'Profile updated successfully',
    data: { user },
  });
});

export const changePassword = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  await authService.changePassword(req.user.id, req.body);

  sendSuccess(res, {
    message: 'Password changed successfully',
  });
});
