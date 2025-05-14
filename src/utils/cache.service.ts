import redisClient from "./redis";

export const CacheService = {
  async set(key: string, value: any, ttlSeconds: number) {
    await redisClient.set(key, JSON.stringify(value), "EX", ttlSeconds);
  },

  async get<T = any>(key: string): Promise<T | null> {
    const data = await redisClient.get(key);
    return data ? (JSON.parse(data) as T) : null;
  },

  async del(key: string): Promise<void> {
    await redisClient.del(key);
  },
};
