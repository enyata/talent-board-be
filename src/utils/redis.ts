import config from "config";
import { Redis } from "ioredis";
import log from "./logger";

const redisUrl = config.get<string>("REDIS_URL");

const redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redisClient.on("error", (error) => {
  // @ts-ignore
  log.error("❌ Redis connection error:", error);
});

redisClient.on("connect", () => {
  log.info("✅ Redis connected successfully");
});

export default redisClient;
