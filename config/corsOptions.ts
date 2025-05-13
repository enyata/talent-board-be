import config from "config";
import { CorsOptions } from "cors";

const devOrigins = [
  "http://localhost:3000",
  "http://localhost:8000",
  "https://accounts.google.com",
  "https://www.linkedin.com",
];

const prodOrigins = [
  "https://accounts.google.com",
  "https://www.linkedin.com",
  "http://localhost:3000",
  config.get<string>("BASE_URL"),
  config.get<string>("FRONTEND_URL"),
];

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const allowedOrigins =
      config.get<string>("NODE_ENV") === "production"
        ? prodOrigins
        : devOrigins;

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Authorization",
    "x-refresh-token",
  ],
};

export default corsOptions;
