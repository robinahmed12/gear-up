import { Response } from 'express';

interface Meta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  [key: string]: unknown;
}

/**
 * Every successful response in the API goes through this helper so the
 * shape is identical everywhere: { success, message, data, meta? }.
 * Pairs with the { success: false, message, errorDetails } shape used
 * by the global error handler for failures.
 */
export const sendSuccess = <T>(
  res: Response,
  {
    statusCode = 200,
    message = 'Request successful',
    data,
    meta,
  }: {
    statusCode?: number;
    message?: string;
    data?: T;
    meta?: Meta;
  },
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    data: data ?? null,
    ...(meta ? { meta } : {}),
  });
};
