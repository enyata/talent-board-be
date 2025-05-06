import config from "config";
import { HelmetOptions } from "helmet";

const isDev = config.get<string>("NODE_ENV") === "development";

const helmetOptions: HelmetOptions = {
  contentSecurityPolicy: isDev
    ? false
    : {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://accounts.google.com",
            "https://www.linkedin.com",
          ],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: [
            "'self'",
            "data:",
            "https://*.linkedin.com",
            "https://*.googleusercontent.com",
          ],
          connectSrc: [
            "'self'",
            "https://accounts.google.com",
            "https://www.linkedin.com",
            config.get<string>("FRONTEND_URL"),
          ],
          frameSrc: ["https://accounts.google.com", "https://www.linkedin.com"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: [
            "'self'",
            "https://accounts.google.com",
            "https://www.linkedin.com",
            config.get<string>("FRONTEND_URL"),
          ],
        },
      },
};

export default helmetOptions;
