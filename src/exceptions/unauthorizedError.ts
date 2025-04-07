import { AppError } from "./appError";

// Handles status code 401 errors for unauthorized requests
export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(message, 401);
  }
}
