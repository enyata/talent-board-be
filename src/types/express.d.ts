import { CustomJwtPayload } from "../interfaces";

declare global {
  namespace Express {
    interface Request {
      user?: CustomJwtPayload | null;
    }
  }
}
