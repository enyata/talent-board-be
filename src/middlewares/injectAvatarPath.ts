import type { NextFunction, Request, Response } from "express";

export const injectAvatarPath = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (req.file && req.file.path) {
    req.body.avatar = req.file.path;
  }
  next();
};
