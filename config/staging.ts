const baseUrl = process.env.TALENTS_BASE_URL || process.env.BASE_URL;
const frontendUrl =
  process.env.TALENTS_FRONTEND_URL || process.env.FRONTEND_URL;

export default {
  PORT: Number(process.env.TALENTS_PORT || process.env.PORT) || 8000,
  NODE_ENV: process.env.TALENTS_NODE_ENV || process.env.NODE_ENV || "staging",
  ACCESS_TOKEN_TTL: process.env.TALENTS_ACCESS_TOKEN_TTL || "15m",
  REFRESH_TOKEN_TTL: process.env.TALENTS_REFRESH_TOKEN_TTL || "7d",
  COOKIE_EXPIRES:
    process.env.TALENTS_COOKIE_EXPIRES ||
    process.env.TALENTS_JWT_COOKIE_EXPIRES_IN ||
    "7d",
  ...(baseUrl ? { BASE_URL: baseUrl } : {}),
  ...(frontendUrl ? { FRONTEND_URL: frontendUrl } : {}),
};
