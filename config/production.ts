export default {
  PORT: Number(process.env.PORT) ?? 8000,
  NODE_ENV: process.env.NODE_ENV,
  API_PREFIX: process.env.API_PREFIX ?? "api/v1",

  DB_USER: process.env.DB_USER,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  DATABASE_URL: process.env.DATABASE_URL,
  BASE_URL: process.env.BASE_URL ?? "https://talent-board-be.onrender.com",
  FRONTEND_URL: process.env.FRONTEND_URL ?? "http://localhost:3000",

  ACCESS_TOKEN_TTL: process.env.ACCESS_TOKEN_TTL || "15m",
  REFRESH_TOKEN_TTL: process.env.REFRESH_TOKEN_TTL || "7d",

  ACCESS_TOKEN_PUBLIC_KEY: process.env.ACCESS_TOKEN_PUBLIC_KEY,
  REFRESH_TOKEN_PUBLIC_KEY: process.env.REFRESH_TOKEN_PUBLIC_KEY,
  ACCESS_TOKEN_PRIVATE_KEY: process.env.ACCESS_TOKEN_PRIVATE_KEY,
  REFRESH_TOKEN_PRIVATE_KEY: process.env.REFRESH_TOKEN_PRIVATE_KEY,

  COOKIE_EXPIRES: process.env.JWT_COOKIE_EXPIRES_IN || "7d",
  SWAGGER_JSON_URL: process.env.SWAGGER_JSON_URL,

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

  LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID,
  LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET,

  EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || "gmail",
  EMAIL_FROM: process.env.EMAIL_FROM || "noreply@talent-board.enyata.com",

  SMTP_HOST: process.env.SMTP_HOST || "smtp.mailtrap.io",
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "2525"),
  SMTP_SECURE: process.env.SMTP_SECURE === "true",
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || "",

  SENDGRID_USERNAME: process.env.SENDGRID_USERNAME || "",
  SENDGRID_PASSWORD: process.env.SENDGRID_PASSWORD || "",

  GMAIL_USER: process.env.GMAIL_USER || "",
  GMAIL_PASSWORD: process.env.GMAIL_PASSWORD || "",

  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  REDIS_CACHE_TTL_LONG: Number(process.env.REDIS_CACHE_TTL_LONG) || 60 * 60, // 1 hour
  REDIS_CACHE_TTL_SHORT: Number(process.env.REDIS_CACHE_TTL_SHORT) || 60 * 5, // 5 minutes
};
