import { MetricsService } from "@src/dashboard/services/metrics.service";
import { MetricsJobData } from "@src/interfaces";
import redisClient from "@src/utils/redis";
import { Job, Worker } from "bullmq";

const worker = new Worker<MetricsJobData>(
  "metricsQueue",
  async (job: Job<MetricsJobData>) => {
    const { userId, field } = job.data;
    await new MetricsService().incrementMetric(userId, field);
  },
  { connection: redisClient },
);

export default worker;
