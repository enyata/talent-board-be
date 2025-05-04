import { CustomJwtPayload } from "../interfaces";

declare global {
  namespace Express {
    interface User extends CustomJwtPayload {}

    interface Request {
      user?: User;
    }
  }
}
