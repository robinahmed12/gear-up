import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendSuccess } from '../../utils/ApiResponse.js';
import * as categoryService from './category.service.js';

export const list = catchAsync(async (_req: Request, res: Response) => {
  const categories = await categoryService.listCategories();

  sendSuccess(res, {
    message: 'Categories fetched successfully',
    data: categories,
  });
});

export const getById = catchAsync(async (req: Request, res: Response) => {
  const category = await categoryService.getCategoryById(req.params.id);

  sendSuccess(res, {
    message: 'Category details fetched successfully',
    data: category,
  });
});

export const create = catchAsync(async (req: Request, res: Response) => {
  const category = await categoryService.createCategory(req.body);

  sendSuccess(res, {
    statusCode: 201,
    message: 'Category created successfully',
    data: category,
  });
});

export const update = catchAsync(async (req: Request, res: Response) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);

  sendSuccess(res, {
    message: 'Category updated successfully',
    data: category,
  });
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  await categoryService.deleteCategory(req.params.id);

  sendSuccess(res, {
    message: 'Category deleted successfully',
  });
});
