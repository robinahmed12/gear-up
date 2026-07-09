import { AppError } from './AppError';

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', errorDetails?: unknown) {
    super(message, 400, errorDetails);
  }
}
