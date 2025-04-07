import { AppError } from "./appError";

// Handles status code 404 errors for not found resources
export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}
