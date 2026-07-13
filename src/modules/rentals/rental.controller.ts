import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import { UnauthorizedError } from '../../errors/UnauthorizedError.js';
import * as rentalService from './rental.service.js';

export const create = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();

  const order = await rentalService.createRentalOrder(req.user.id, req.body);

  sendSuccess(res, {
    statusCode: 201,
    message: 'Rental order placed successfully',
    data: order,
  });
});

// get customer rental order 

export const listOwn = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();

  const { items, meta } = await rentalService.getCustomerRentals(req.user.id, req.query as never);

  sendSuccess(res, {
    message: 'Your rental orders fetched successfully',
    data: items,
    meta,
  });
});

// get by id
export const getById = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();

  const order = await rentalService.getRentalByIdForUser(req.params.id, req.user);

  sendSuccess(res, {
    message: 'Rental order details fetched successfully',
    data: order,
  });
});

// delete rental order 
export const cancel = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();

  const order = await rentalService.cancelRentalOrder(req.params.id, req.user.id);

  sendSuccess(res, {
    message: 'Rental order cancelled successfully',
    data: order,
  });
});

// get rental order for provider 
export const listProviderOrders = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();

  const { items, meta } = await rentalService.getProviderOrders(req.user.id, req.query as never);

  sendSuccess(res, {
    message: 'Incoming orders fetched successfully',
    data: items,
    meta,
  });
});

export const updateStatus = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();

  const order = await rentalService.updateOrderStatus(req.params.id, req.user.id, req.body);

  sendSuccess(res, {
    message: 'Order status updated successfully',
    data: order,
  });
});

export const listAllForAdmin = catchAsync(async (req: Request, res: Response) => {
  const { items, meta } = await rentalService.getAllRentalsForAdmin(req.query as never);

  sendSuccess(res, {
    message: 'All rental orders fetched successfully',
    data: items,
    meta,
  });
});
