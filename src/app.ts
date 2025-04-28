import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Express, NextFunction, Request, Response } from "express";
import helmet from "helmet";
import hpp from "hpp";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import "@/auth/loadStrategies";
import AppDataSource from "@/datasource";
import { MethodNotAllowedError } from "@/exceptions/methodNotAllowedError";
import { NotFoundError } from "@/exceptions/notFoundError";
import globalErrorHandler from "@/middlewares/errorHandler";
import router from "@/routes/index.route";
import corsOptions from "../config/corsOptions";
import config from "../config/default";
import helmetOptions from "../config/helmetOptions";
import hppOptions from "../config/hppOptions";
import swaggerSpec from "../config/swaggerConfig";

const app: Express = express();
app.disable("x-powered-by");

app.use(helmet(helmetOptions));
if (
  config.NODE_ENV === "production" &&
  !["localhost", "127.0.0.1"].includes(config.BASE_URL)
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
app.use("/openapi.json", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.use(`/${config.API_PREFIX}`, router);
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
