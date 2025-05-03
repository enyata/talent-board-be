import type { NextFunction, Request, Response } from "express";

export const parseFormDataFields = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const fieldsToParseAsJson = ["skills"];

  for (const field of fieldsToParseAsJson) {
    if (req.body[field]) {
      try {
        const parsed = JSON.parse(req.body[field]);

        if (!Array.isArray(parsed)) {
          return void res.status(400).json({
            error: `${field} must be a JSON array`,
          });
        }

        req.body[field] = parsed;
      } catch {
        return void res.status(400).json({
          error: `${field} must be a valid JSON array string`,
        });
      }
    }
  }

  next();
};
