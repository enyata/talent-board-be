import "dotenv/config";

import config from "config";
import "reflect-metadata";

import app from "./app";
import AppDataSource from "./datasource";
import { startIncompleteSignupReminderScheduler } from "./utils/email/incompleteSignupReminder.scheduler";
import log from "./utils/logger";
import "./workers/index";

const port = config.get<number>("PORT") ?? 8000;
log.info({ port }, "Resolved application port");

const bootstrap = async () => {
  try {
    await AppDataSource.initialize();
    log.info("Database connected successfully");

    startIncompleteSignupReminderScheduler();

    app.listen(port, () => {
      log.info(
        `🚀 Server running at http://localhost:${port} [${config.get<string>("NODE_ENV")}]`,
      );
    });
  } catch (error) {
    log.error({ err: error }, "Failed to start the server");
    process.exit(1);
  }
};

bootstrap();
