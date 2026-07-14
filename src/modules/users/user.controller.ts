import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import * as userService from './user.service.js';

/**
 * Controller: list
 * ----------------
 * Retrieves a paginated list of users.
 * - Accepts query parameters for filtering, sorting, and pagination.
 * - Delegates data retrieval to userService.
 * - Responds with standardized success payload including items and metadata.
 */
export const list = catchAsync(async (req: Request, res: Response) => {
  const { items, meta } = await userService.listUsers(req.query as never);

  sendSuccess(res, {
    message: 'Users fetched successfully',
    data: items,
    meta,
  });
});

/**
 * Controller: updateStatus
 * ------------------------
 * Updates the status of a specific user (e.g., suspend or activate).
 * - Accepts user ID from route params.
 * - Accepts status update payload from request body.
 * - Delegates update logic to userService.
 * - Responds with a success message reflecting the new status.
 */
export const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.updateUserStatus(req.params.id, req.body);

  sendSuccess(res, {
    message: `User ${user.status === 'SUSPENDED' ? 'suspended' : 'activated'} successfully`,
    data: user,
  });
});

