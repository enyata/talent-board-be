import { MetricsService } from "@src/dashboard/services/metrics.service";
import { MetricsJobData } from "@src/interfaces";
import log from "@src/utils/logger";
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

worker.on("failed", (job, error) => {
  log.error(
    {
      event: "worker_failed",
      worker: "metricsQueue",
      jobId: job?.id,
      jobName: job?.name,
      jobData: job?.data,
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
      },
    },
    "Metrics worker failed",
  );
});

export default worker;
