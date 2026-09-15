export default {
  SENTRY_DSN: process.env.TALENTS_SENTRY_DSN || "",
  SENTRY_PROFILING_ENABLED:
    String(process.env.TALENTS_SENTRY_PROFILING_ENABLED) === "true",
  PORT: Number(process.env.TALENTS_PORT || process.env.PORT) || 8000,
  NODE_ENV: process.env.TALENTS_NODE_ENV || process.env.NODE_ENV,
  API_PREFIX: process.env.TALENTS_API_PREFIX ?? "api/v1",
  APP_NAME: process.env.TALENTS_APP_NAME ?? "Talent Board",
  OTP_TTL_MINUTES: Number(process.env.TALENTS_OTP_TTL_MINUTES) || 10,
  PASSWORD_RESET_TOKEN_TTL_MINUTES: 60, // Token valid for 60 minutes
  OTP_RESEND_COOLDOWN_SECONDS: 60,
  PASSWORD_RESET_COOLDOWN_SECONDS: 120, // 2 minutes cooldown between reset requests
  MESSAGE_REQUEST_DECLINE_COOLDOWN_DAYS:
    Number(
      process.env.TALENTS_MESSAGE_REQUEST_DECLINE_COOLDOWN_DAYS ||
        process.env.MESSAGE_REQUEST_DECLINE_COOLDOWN_DAYS,
    ) || 30,

  DB_USER: process.env.TALENTS_DB_USER,
  DB_HOST: process.env.TALENTS_DB_HOST,
  DB_PORT: process.env.TALENTS_DB_PORT,
  DB_PASSWORD: process.env.TALENTS_DB_PASSWORD,
  DB_NAME: process.env.TALENTS_DB_NAME,
  DATABASE_URL: process.env.TALENTS_DATABASE_URL,
  BASE_URL:
    process.env.TALENTS_BASE_URL ||
    process.env.BASE_URL ||
    "http://localhost:8000",
  FRONTEND_URL:
    process.env.TALENTS_FRONTEND_URL ||
    process.env.FRONTEND_URL ||
    "http://localhost:3000",

  ACCESS_TOKEN_TTL: process.env.TALENTS_ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL: process.env.TALENTS_REFRESH_TOKEN_TTL,

  ACCESS_TOKEN_PUBLIC_KEY: process.env.TALENTS_ACCESS_TOKEN_PUBLIC_KEY,
  REFRESH_TOKEN_PUBLIC_KEY: process.env.TALENTS_REFRESH_TOKEN_PUBLIC_KEY,
  ACCESS_TOKEN_PRIVATE_KEY: process.env.TALENTS_ACCESS_TOKEN_PRIVATE_KEY,
  REFRESH_TOKEN_PRIVATE_KEY: process.env.TALENTS_REFRESH_TOKEN_PRIVATE_KEY,

  COOKIE_EXPIRES: process.env.TALENTS_JWT_COOKIE_EXPIRES_IN,
  SWAGGER_JSON_URL: process.env.TALENTS_SWAGGER_JSON_URL,

  GOOGLE_CLIENT_ID: process.env.TALENTS_GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.TALENTS_GOOGLE_CLIENT_SECRET,

  LINKEDIN_CLIENT_ID: process.env.TALENTS_LINKEDIN_CLIENT_ID,
  LINKEDIN_CLIENT_SECRET: process.env.TALENTS_LINKEDIN_CLIENT_SECRET,

  EMAIL_PROVIDER:
    process.env.TALENTS_EMAIL_PROVIDER || process.env.EMAIL_PROVIDER || "gmail",
  EMAIL_FROM:
    process.env.TALENTS_EMAIL_FROM ||
    process.env.EMAIL_FROM ||
    "community@enyata.com",

  SMTP_HOST:
    process.env.TALENTS_SMTP_HOST ||
    process.env.SMTP_HOST ||
    "smtp.mailtrap.io",
  SMTP_PORT: parseInt(
    process.env.TALENTS_SMTP_PORT || process.env.SMTP_PORT || "2525",
  ),
  SMTP_SECURE:
    String(process.env.TALENTS_SMTP_SECURE || process.env.SMTP_SECURE) ===
    "true",
  SMTP_USER: process.env.TALENTS_SMTP_USER || process.env.SMTP_USER || "",
  SMTP_PASSWORD:
    process.env.TALENTS_SMTP_PASSWORD || process.env.SMTP_PASSWORD || "",

  SENDGRID_USERNAME: process.env.TALENTS_SENDGRID_USERNAME || "",
  SENDGRID_PASSWORD: process.env.TALENTS_SENDGRID_PASSWORD || "",

  GMAIL_USER: process.env.TALENTS_GMAIL_USER || process.env.GMAIL_USER || "",
  GMAIL_PASSWORD:
    process.env.TALENTS_GMAIL_PASSWORD || process.env.GMAIL_PASSWORD || "",

  REDIS_URL: process.env.TALENTS_REDIS_URL || "redis://redis:6379",
  REDIS_CACHE_TTL_LONG:
    Number(process.env.TALENTS_REDIS_CACHE_TTL_LONG) || 60 * 60, // 1 hour
  REDIS_CACHE_TTL_SHORT:
    Number(process.env.TALENTS_REDIS_CACHE_TTL_SHORT) || 60 * 5, // 5 minutes
};
