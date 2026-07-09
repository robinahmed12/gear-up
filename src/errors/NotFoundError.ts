import { AppError } from './AppError';

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', errorDetails?: unknown) {
    super(message, 404, errorDetails);
  }
}
