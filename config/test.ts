export default {
  PORT: 8001,
  NODE_ENV: "test",
  API_PREFIX: "api/v1",

  DB_USER: "test_user",
  DB_HOST: "localhost",
  DB_PORT: 5433,
  DB_PASSWORD: "test_password",
  DB_NAME: "test_db",
  DATABASE_URL: "postgres://test_user:test_password@localhost:5433/test_db",

  accessTokenTtl: "1m",
  refreshTokenTtl: "7d",

  accessTokenPublicKey: "test_public_key",
  refreshTokenPublicKey: "test_public_key",
  accessTokenPrivateKey: "test_private_key",
  refreshTokenPrivateKey: "test_private_key",

  cookieExpires: "1d",
  SWAGGER_JSON_URL: "",

  GOOGLE_CLIENT_ID: "google_client_id",
  GOOGLE_CLIENT_SECRET: "google_client_secret",

  LINKEDIN_CLIENT_ID: "linkedin_client_id",
  LINKEDIN_CLIENT_SECRET: "linkedin_client_secret",

  REDIS_URL: "redis://redis:6379",
  REDIS_CACHE_TTL_LONG: 60 * 60, // 1 hour
  REDIS_CACHE_TTL_SHORT: 60 * 5, // 5 minutes
};
