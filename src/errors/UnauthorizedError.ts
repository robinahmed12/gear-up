import { AppError } from './AppError';

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', errorDetails?: unknown) {
    super(message, 401, errorDetails);
  }
}
