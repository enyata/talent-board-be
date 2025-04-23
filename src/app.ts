import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import type { Express, NextFunction, Request, Response } from "express";
import express from "express";
import helmet from "helmet";
import hpp from "hpp";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import config from "../config/default";
import swaggerSpec from "../config/swaggerConfig";
import AppDataSource from "./datasource";
import { MethodNotAllowedError } from "./exceptions/methodNotAllowedError";
import { NotFoundError } from "./exceptions/notFoundError";
import globalErrorHandler from "./middlewares/errorHandler";
import router from "./routes/index.route";
import "./strategies/google.strategy";

const app: Express = express();
app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", "accounts.google.com"],
        scriptSrc: ["'self'", "'unsafe-inline'", "accounts.google.com"],
        frameSrc: ["accounts.google.com"],
        connectSrc: ["'self'", "https://accounts.google.com"],
      },
    },
  }),
);
app.options("*", cors());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Authorization",
    ],
    credentials: true,
  }),
);

app.use(
  hpp({
    whitelist: ["legal", "dispute resolution"],
  }),
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

if (config.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(compression());
app.get("/health", async (req: Request, res: Response) => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const isDbConnected = AppDataSource.isInitialized;

    res.status(200).json({
      status: "success",
      message: "API is running",
      database: isDbConnected ? "connected" : "disconnected",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "API is down",
      error: error.message,
    });
  }
});
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/" + config.API_PREFIX, router);
app.use("/openapi.json", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.use((req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next();
  }
  next(
    new MethodNotAllowedError(
      `Method ${req.method} not allowed on ${req.originalUrl}`,
    ),
  );
});

app.use("*", (req: Request, res: Response, next: NextFunction) => {
  next(new NotFoundError(`Can't find ${req.originalUrl} on this server!`));
});

app.use(globalErrorHandler);

export default app;
