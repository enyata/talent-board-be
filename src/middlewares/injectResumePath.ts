import type { NextFunction, Request, Response } from "express";

export const injectResumePath = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (req.file && req.file.path) {
    req.body.resume_path = req.file.path;
  }
  next();
};
