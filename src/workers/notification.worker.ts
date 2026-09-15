import { NotificationService } from "@src/dashboard/services/notification.service";
import { NotificationJobData } from "@src/interfaces";
import log from "@src/utils/logger";
import redisClient from "@src/utils/redis";
import { Job, Worker } from "bullmq";

const worker = new Worker<NotificationJobData>(
  "notificationQueue",
  async (job: Job<NotificationJobData>) => {
    const { senderId, recipientId, type } = job.data;
    await new NotificationService().sendNotification(
      type,
      senderId,
      recipientId,
    );
  },
  { connection: redisClient },
);

worker.on("failed", (job, error) => {
  log.error(
    {
      event: "worker_failed",
      worker: "notificationQueue",
      jobId: job?.id,
      jobName: job?.name,
      jobData: job?.data,
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
      },
    },
    "Notification worker failed",
  );
});

export default worker;
