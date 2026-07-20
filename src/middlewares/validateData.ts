import log from "@src/utils/logger";
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

        log.warn(
          {
            event: "validation_failed",
            request: {
              method: req.method,
              path: req.originalUrl,
              requestId: req.get("x-request-id") || req.get("x-correlation-id"),
              ip: req.ip,
            },
            issues: error.errors.map((issue) => ({
              path: issue.path.join("."),
              message: issue.message,
              code: issue.code,
            })),
          },
          "Request validation failed",
        );

        res.status(422).json({ errors: errorMessages });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  };
