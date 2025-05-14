import { UserRole } from "@src/entities/user.entity";
import { ForbiddenError } from "@src/exceptions/forbiddenError";
import { NextFunction, Request, Response } from "express";

export const checkRole = (role: UserRole | UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user || !user.role) {
      throw new ForbiddenError("Access denied. No role assigned.");
    }

    const allowedRoles = Array.isArray(role) ? role : [role];
    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenError(
        `Access denied. Requires role: ${allowedRoles.join(", ")}`,
      );
    }

    next();
  };
};
