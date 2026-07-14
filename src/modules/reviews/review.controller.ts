import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import { UnauthorizedError } from '../../errors/UnauthorizedError.js';
import * as reviewService from './review.service.js';

/**
 * Controller: create
 * ------------------
 * Handles submission of a new review.
 * - Requires an authenticated user (throws UnauthorizedError if missing).
 * - Delegates review creation logic to reviewService.
 * - Responds with a standardized success payload.
 */
export const create = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();

  const review = await reviewService.createReview(req.user.id, req.body);

  sendSuccess(res, {
    statusCode: 201,
    message: 'Review submitted successfully',
    data: review,
  });
});

/**
 * Controller: listForGear
 * -----------------------
 * Fetches reviews associated with a specific gear item.
 * - Accepts gear ID from route params.
 * - Supports query parameters for pagination/filtering.
 * - Delegates retrieval logic to reviewService.
 * - Responds with reviews data and metadata (pagination info).
 */
export const listForGear = catchAsync(async (req: Request, res: Response) => {
  const { items, meta } = await reviewService.getReviewsForGear(
    req.params.id,
    req.query as never
  );

  sendSuccess(res, {
    message: 'Reviews fetched successfully',
    data: items,
    meta,
  });
});
