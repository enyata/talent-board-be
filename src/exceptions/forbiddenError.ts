import { AppError } from "./appError";

// Handles status code 403 errors for restricted requests
export class ForbiddenError extends AppError {
  constructor(message: string) {
    super(message, 403);
  }
}
