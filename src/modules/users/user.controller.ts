import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import * as userService from './user.service.js';

export const list = catchAsync(async (req: Request, res: Response) => {
  const { items, meta } = await userService.listUsers(req.query as never);

  sendSuccess(res, {
    message: 'Users fetched successfully',
    data: items,
    meta,
  });
});

export const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.updateUserStatus(req.params.id, req.body);

  sendSuccess(res, {
    message: `User ${user.status === 'SUSPENDED' ? 'suspended' : 'activated'} successfully`,
    data: user,
  });
});
