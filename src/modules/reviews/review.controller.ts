import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import { UnauthorizedError } from '../../errors/UnauthorizedError.js';
import * as reviewService from './review.service.js';

export const create = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();

  const review = await reviewService.createReview(req.user.id, req.body);

  sendSuccess(res, {
    statusCode: 201,
    message: 'Review submitted successfully',
    data: review,
  });
});

export const listForGear = catchAsync(async (req: Request, res: Response) => {
  const { items, meta } = await reviewService.getReviewsForGear(req.params.id, req.query as never);

  sendSuccess(res, {
    message: 'Reviews fetched successfully',
    data: items,
    meta,
  });
});
