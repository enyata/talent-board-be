import { NotificationService } from "@src/dashboard/services/notification.service";
import { NotificationJobData } from "@src/interfaces";
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

export default worker;
