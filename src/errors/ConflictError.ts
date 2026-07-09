import { AppError } from './AppError';

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists', errorDetails?: unknown) {
    super(message, 409, errorDetails);
  }
}
