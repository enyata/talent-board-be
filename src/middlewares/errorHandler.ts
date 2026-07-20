import { AppError } from "@src/exceptions/appError";
import { IResponseError } from "@src/interfaces";
import log from "@src/utils/logger";
import config from "config";
import type { NextFunction, Request, Response } from "express";
import { JsonWebTokenError } from "jsonwebtoken";

const handleJWTError = (err: any) =>
  new AppError("Invalid or expired token", 401);

const buildRequestContext = (req: Request) => ({
  method: req.method,
  path: req.originalUrl,
  requestId: req.get("x-request-id") || req.get("x-correlation-id"),
  ip: req.ip,
});

const serializeError = (err: any) => ({
  name: err?.name,
  message: err?.message,
  stack: err?.stack,
  statusCode: err?.statusCode,
  status: err?.status,
  code: err?.code,
  cause: err?.cause
    ? {
        name: err.cause.name,
        message: err.cause.message,
      }
    : undefined,
  details: err?.issues || err?.errors || err?.details,
});

export const sendErrorDev = (err: any, req: Request, res: Response) => {
  log.error(
    {
      event: "request_failed",
      request: buildRequestContext(req),
      error: serializeError(err),
    },
    "Request failed",
  );

  return res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

export const sendErrorProd = (err: any, req: Request, res: Response) => {
  if (err.isOperational) {
    const appError = err as AppError;

    let response = {
      status: appError.status,
      message: appError.message,
      status_code: appError.statusCode,
    } as IResponseError;

    log.warn(
      {
        event: "operational_request_error",
        request: buildRequestContext(req),
        error: serializeError(appError),
      },
      "Operational request error",
    );

    return res.status(appError.statusCode).json(response);
  }

  log.error(
    {
      event: "unhandled_request_error",
      request: buildRequestContext(req),
      error: serializeError(err),
    },
    "Unhandled request error",
  );

  return res.status(500).json({
    status: "error",
    message: "Something went wrong!",
    status_code: 500,
  });
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
  } else {
    if (err instanceof JsonWebTokenError) err = handleJWTError(err);
    sendErrorProd(err, req, res);
  }
};

export default errorHandler;
