import config from "config";
import "dotenv";
import "reflect-metadata";

import app from "./app";
import AppDataSource from "./datasource";
import log from "./utils/logger";

const port = config.get<number>("PORT");

AppDataSource.initialize()
  .then(async () => {
    app.listen(port, () => {
      log.info(`App is listening on port ${port}`);
    });
  })
  .catch((error) => log.error(error));
