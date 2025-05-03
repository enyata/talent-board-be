import config from "config";
import { CorsOptions } from "cors";

const devOrigins = [
  "https://localhost:3000",
  "http://localhost:8000",
  "https://accounts.google.com",
  "https://www.linkedin.com",
];

const prodOrigins = [
  "https://accounts.google.com",
  "https://www.linkedin.com",
  //TODO: Add live frontend domain here
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
  ],
};

export default corsOptions;
