import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import { UnauthorizedError } from '../../errors/UnauthorizedError.js';
import * as gearService from './gear.service.js';

// get all gear item 
export const list = catchAsync(async (req: Request, res: Response) => {
  const { items, meta } = await gearService.listGear(req.query as never);

  sendSuccess(res, {
    message: 'Gear fetched successfully',
    data: items,
    meta,
  });
});

// get all gear item by id 
export const getById = catchAsync(async (req: Request, res: Response) => {
  const gear = await gearService.getGearById(req.params.id);

  sendSuccess(res, {
    message: 'Gear details fetched successfully',
    data: gear,
  });
});

// crate gear item 
export const create = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();

  const gear = await gearService.createGear(req.user.id, req.body);

  sendSuccess(res, {
    statusCode: 201,
    message: 'Gear created successfully',
    data: gear,
  });
});

// update gear item 
export const update = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();

  const gear = await gearService.updateGear(req.params.id, req.user.id, req.body);

  sendSuccess(res, {
    message: 'Gear updated successfully',
    data: gear,
  });
});

// deleted gear item 
export const remove = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();

  await gearService.deleteGear(req.params.id, req.user.id);

  sendSuccess(res, {
    message: 'Gear deleted successfully',
  });
});

export const listOwn = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();

  const { items, meta } = await gearService.listProviderGear(req.user.id, req.query as never);

  sendSuccess(res, {
    message: 'Your gear inventory fetched successfully',
    data: items,
    meta,
  });
});


// get all gear for admin 

export const listAllForAdmin = catchAsync(async (req: Request, res: Response) => {
  const { items, meta } = await gearService.listGearForAdmin(req.query as never);

  sendSuccess(res, {
    message: 'All gear listings fetched successfully',
    data: items,
    meta,
  });
});
