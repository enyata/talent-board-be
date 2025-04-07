import { AppError } from "./appError";

// Handles status code 409 errors for conflicting requests
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}
