const isDocker = process.env.IS_DOCKER === "true";

export default {
  PORT: 8001,
  NODE_ENV: "test",
  API_PREFIX: "api/v1",

  DB_USER: "test_user",
  DB_HOST: "localhost",
  DB_PORT: isDocker ? 5432 : 5433,
  DB_PASSWORD: "test_password",
  DB_NAME: "test_db",
  DATABASE_URL: isDocker
    ? "postgres://test_user:test_password@postgres_test:5432/test_db"
    : "postgres://test_user:test_password@localhost:5433/test_db",

  ACCESS_TOKEN_TTL: "1m",
  REFRESH_TOKEN_TTL: "7d",

  ACCESS_TOKEN_PUBLIC_KEY: "test_public_key",
  REFRESH_TOKEN_PUBLIC_KEY: "test_public_key",
  ACCESS_TOKEN_PRIVATE_KEY: "test_private_key",
  REFRESH_TOKEN_PRIVATE_KEY: "test_private_key",

  COOKIE_EXPIRES: "1d",
  SWAGGER_JSON_URL: "",

  GOOGLE_CLIENT_ID: "google_client_id",
  GOOGLE_CLIENT_SECRET: "google_client_secret",

  LINKEDIN_CLIENT_ID: "linkedin_client_id",
  LINKEDIN_CLIENT_SECRET: "linkedin_client_secret",

  REDIS_URL: "redis://redis:6379",
  REDIS_CACHE_TTL_LONG: 60 * 60, // 1 hour
  REDIS_CACHE_TTL_SHORT: 60 * 5, // 5 minutes
};
