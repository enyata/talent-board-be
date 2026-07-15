import { IncompleteSignupReminderJobData } from "@src/interfaces";
import redisClient from "@src/utils/redis";
import { Queue } from "bullmq";

// This queue is responsible for sending reminders to users who have not completed their signup process.
export const incompleteSignupReminderQueue =
  new Queue<IncompleteSignupReminderJobData>("incompleteSignupReminderQueue", {
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
