import { AppError } from "./appError";

// Handles status code 405 errors for method not allowed
export class MethodNotAllowedError extends AppError {
  constructor(message: string) {
    super(message, 405);
  }
}
