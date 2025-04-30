import compression from "compression";
import config from "config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Express, NextFunction, Request, Response } from "express";
import helmet from "helmet";
import hpp from "hpp";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import "@src/auth/loadStrategies";
import { MethodNotAllowedError } from "@src/exceptions/methodNotAllowedError";
import { NotFoundError } from "@src/exceptions/notFoundError";
import globalErrorHandler from "@src/middlewares/errorHandler";
import router from "@src/routes/index.route";
import corsOptions from "../config/corsOptions";
import helmetOptions from "../config/helmetOptions";
import hppOptions from "../config/hppOptions";
import swaggerSpec from "../config/swaggerConfig";
import AppDataSource from "./datasource";

const app: Express = express();
app.disable("x-powered-by");

app.use(helmet(helmetOptions));
if (
  config.get<string>("NODE_ENV") === "production" &&
  !["localhost", "127.0.0.1"].includes(config.get<string>("BASE_URL"))
) {
  app.use(
    helmet.hsts({
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    }),
  );
}

app.use(cors(corsOptions));
app.use(hpp(hppOptions));

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

if (config.get<string>("NODE_ENV") === "development") {
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
app.use("/openapi.json", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.use(`/${config.get<string>("API_PREFIX")}`, router);
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next();
  if (
    req.method !== "GET" &&
    req.method !== "POST" &&
    req.method !== "PATCH" &&
    req.method !== "DELETE"
  ) {
    return next(
      new MethodNotAllowedError(
        `Method ${req.method} not allowed on ${req.originalUrl}`,
      ),
    );
  }
  next(new NotFoundError(`Can't find ${req.originalUrl} on this server!`));
});

app.use(globalErrorHandler);

export default app;
