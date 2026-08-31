import { randomUUID } from "crypto";
import dayjs from "dayjs";
import type { NextFunction, Request, Response } from "express";
import pino from "pino";
import { getNodeEnv, isDevelopmentEnv } from "./environment";

const nodeEnv = getNodeEnv();
const isDocker = process.env.IS_DOCKER === "true";
const transport =
  isDevelopmentEnv() && !isDocker
    ? pino.transport({
        target: "pino-pretty",
      })
    : undefined;

const loggerOptions: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || "info",
  base: { pid: false, app: "talent-board-be", env: nodeEnv },
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: () => `,"time":"${dayjs().format()}"`,
};

const log = transport ? pino(loggerOptions, transport) : pino(loggerOptions);

export const buildRequestContext = (req: Request) => ({
  requestId: req.requestId,
  method: req.method,
  path: req.originalUrl,
  route: req.route?.path,
  ip: req.ip,
  userAgent: req.get("user-agent"),
  userId: req.user?.id,
  userRole: req.user?.role,
});

export const logHttpRequests = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const incomingRequestId =
    req.get("x-request-id") || req.get("x-correlation-id");
  req.requestId = incomingRequestId || randomUUID();
  res.setHeader("x-request-id", req.requestId);

  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const payload = {
      event: "http_request",
      request: buildRequestContext(req),
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
    };

    if (res.statusCode >= 500) {
      log.error(payload, "HTTP request failed");
      return;
    }

    if (res.statusCode >= 400) {
      log.warn(payload, "HTTP request completed with client error");
      return;
    }

    log.info(payload, "HTTP request completed");
  });

  next();
};

export const closeLogger = async () => {
  await transport?.end();
};

export default log;
