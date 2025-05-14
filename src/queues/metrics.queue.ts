import { MetricsJobData } from "@src/interfaces";
import redisClient from "@src/utils/redis";
import { Queue } from "bullmq";

export const metricsQueue = new Queue<MetricsJobData>("metricsQueue", {
  connection: redisClient,
  defaultJobOptions: {
    attempts: 3,
    removeOnComplete: true,
    backoff: {
      type: "exponential",
      delay: 3000,
    },
  },
});
