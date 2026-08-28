import AppDataSource from "@src/datasource";
import { UserEntity } from "@src/entities/user.entity";
import { IncompleteSignupReminderJobData } from "@src/interfaces";
import { incompleteSignupReminderQueue } from "@src/queues/incompleteSignupReminder.queue";
import { getNextIncompleteSignupReminderDate } from "@src/utils/email/incompleteSignupReminderSchedule";
import { EmailService } from "@src/utils/email";
import log from "@src/utils/logger";
import redisClient from "@src/utils/redis";
import config from "config";
import { Job, Worker } from "bullmq";

const worker = new Worker<IncompleteSignupReminderJobData>(
  "incompleteSignupReminderQueue",
  async (job: Job<IncompleteSignupReminderJobData>) => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const manager = AppDataSource.manager;
    const user = await manager.findOne(UserEntity, {
      where: { id: job.data.userId },
    });

    if (!user || user.profile_completed) {
      return;
    }

    const maxReminders = config.has("INCOMPLETE_SIGNUP_MAX_REMINDERS")
      ? config.get<number>("INCOMPLETE_SIGNUP_MAX_REMINDERS")
      : 6;

    if (user.incomplete_signup_reminder_count >= maxReminders) {
      return;
    }

    const now = new Date();
    if (
      user.incomplete_signup_next_reminder_at &&
      user.incomplete_signup_next_reminder_at > now
    ) {
      return;
    }

    const firstName = user.first_name || "there";
    const audience = user.role === "recruiter" ? "recruiter" : "talent";
    const frontendUrl =
      config.get<string>("FRONTEND_URL") || "http://localhost:3000";
    const completeSignupUrl = `${frontendUrl.replace(/\/$/, "")}/onboarding`;

    await EmailService.sendIncompleteSignup(
      user.email,
      completeSignupUrl,
      firstName,
      audience,
    );

    user.incomplete_signup_reminder_count += 1;
    user.incomplete_signup_last_reminder_at = now;
    user.incomplete_signup_next_reminder_at =
      getNextIncompleteSignupReminderDate(
        user.incomplete_signup_reminder_count,
        now,
      );

    await manager.save(user);
  },
  { connection: redisClient },
);

worker.on("failed", (job, error) => {
  log.error(
    { err: error, jobId: job?.id, jobData: job?.data },
    "Incomplete signup reminder worker failed",
  );
});

export const enqueueIncompleteSignupReminder = async (userId: string) => {
  await incompleteSignupReminderQueue.add(
    "sendIncompleteSignupReminder",
    { userId },
    { jobId: `incompleteSignupReminder:${userId}` },
  );
};

export default worker;
