import type { NextFunction, Request, Response } from "express";
import { z, ZodError } from "zod";

export const validateData =
  (
    schema: z.ZodObject<any, any> | z.ZodEffects<any>,
    targets: ("body" | "query" | "params")[] = ["body"],
  ) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      targets.forEach((target) => {
        if (target in req) {
          const validatedData = schema.parse(req[target]);
          req[target] = validatedData;
        }
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((issue: any) => ({
          message: `${issue.path.join(".")} is ${issue.message}`,
        }));
        res.status(422).json({ errors: errorMessages });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  };
