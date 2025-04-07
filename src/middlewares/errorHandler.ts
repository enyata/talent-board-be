import config from "config";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../exceptions/appError";
import { IResponseError } from "../interfaces";
import log from "../utils/logger";

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
    sendErrorProd(err, req, res);
  }
};

export default errorHandler;
