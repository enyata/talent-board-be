export default {
  PORT: 8001,
  NODE_ENV: "test",
  API_PREFIX: "api/v1",

  DB_USER: "test_user",
  DB_HOST: "localhost",
  DB_PORT: 5432,
  DB_PASSWORD: "test_password",
  DB_NAME: "test_db",

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
};
