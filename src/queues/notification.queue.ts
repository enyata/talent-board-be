import { NotificationJobData } from "@src/interfaces";
import redisClient from "@src/utils/redis";
import { Queue } from "bullmq";

export const notificationQueue = new Queue<NotificationJobData>(
  "notificationQueue",
  {
    connection: redisClient,
    defaultJobOptions: {
      attempts: 3,
      removeOnComplete: true,
      backoff: {
        type: "exponential",
        delay: 3000,
      },
    },
  },
);
