import { AppError } from "@src/exceptions/appError";
import { IResponseError } from "@src/interfaces";
import log from "@src/utils/logger";
import config from "config";
import type { NextFunction, Request, Response } from "express";
import { JsonWebTokenError } from "jsonwebtoken";

const handleJWTError = (err: any) =>
  new AppError("Invalid or expired token", 401);

export const sendErrorDev = (err: any, req: Request, res: Response) => {
  if (req.originalUrl.startsWith("/api")) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
};

export const sendErrorProd = (err: any, req: Request, res: Response) => {
  if (req.originalUrl.startsWith("/api")) {
    if (err.isOperational) {
      const appError = err as AppError;

      let response = {
        status: appError.status,
        message: appError.message,
        statusCode: appError.statusCode,
      } as IResponseError;

      return res.status(appError.statusCode).json(response);
    }

    log.error(`💥: ${err}`);

    return res.status(500).json({
      status: "error",
      message: "Something went wrong!",
      statusCode: 500,
    });
  }
};

const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  err.statusCode = err.statusCode ?? 500;
  err.status = err.status ?? "error";

  const env = config.get<string>("NODE_ENV");

  if (env === "development") {
    sendErrorDev(err, req, res);
  } else if (env === "production") {
    if (err instanceof JsonWebTokenError) err = handleJWTError(err);
    sendErrorProd(err, req, res);
  }
};

export default errorHandler;
