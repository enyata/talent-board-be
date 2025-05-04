import type { NextFunction, Request, Response } from "express";

/**
 * Creates middleware to parse specified request fields as JSON arrays.
 * @param fieldsToParse Array of field names to parse
 */
export const parseFormDataFields =
  (fieldsToParse: string[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    for (const field of fieldsToParse) {
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
