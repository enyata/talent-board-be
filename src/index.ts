import config from "config";
import "dotenv";
import { readFileSync } from "fs";
import { createServer } from "https";
import "reflect-metadata";

import app from "./app";
import AppDataSource from "./datasource";
import log from "./utils/logger";

const port = config.get<number>("PORT") ?? 8000;

const sslOptions = {
  key: readFileSync("localhost-key.pem"),
  cert: readFileSync("localhost.pem"),
};

const bootstrap = async () => {
  try {
    await AppDataSource.initialize();
    log.info("Database connected successfully");
    createServer(sslOptions, app).listen(port, () => {
      log.info(
        `🚀 Server running securely at https://localhost:${port} [${config.get<string>("NODE_ENV")}]`,
      );
    });
  } catch (error) {
    log.error("Failed to start the server", error);
    process.exit(1);
  }
};

bootstrap();
