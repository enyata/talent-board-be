import { AppError } from "./appError";

// Handles status code 400 errors for bad requests
export class ClientError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}
