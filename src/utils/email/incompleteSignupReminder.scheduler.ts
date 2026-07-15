import AppDataSource from "@src/datasource";
import { UserEntity } from "@src/entities/user.entity";
import config from "config";
import log from "../logger";
import { EmailService } from "./../email";
import { getNextIncompleteSignupReminderDate } from "./incompleteSignupReminderSchedule";

const getScanIntervalMs = () => {
  if (config.has("INCOMPLETE_SIGNUP_SCAN_INTERVAL_MS")) {
    return config.get<number>("INCOMPLETE_SIGNUP_SCAN_INTERVAL_MS");
  }

  // Default: every 6 hours.
  return 6 * 60 * 60 * 1000;
};

const getBatchSize = () => {
  if (config.has("INCOMPLETE_SIGNUP_SCAN_BATCH_SIZE")) {
    return config.get<number>("INCOMPLETE_SIGNUP_SCAN_BATCH_SIZE");
  }
  return 200;
};

export const runIncompleteSignupReminderSweep = async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const manager = AppDataSource.manager;
  const now = new Date();
  const maxReminders = config.has("INCOMPLETE_SIGNUP_MAX_REMINDERS")
    ? config.get<number>("INCOMPLETE_SIGNUP_MAX_REMINDERS")
    : 6;

  const users = await manager
    .createQueryBuilder(UserEntity, "user")
    .where("user.profile_completed = false")
    .andWhere("user.incomplete_signup_reminder_count < :maxReminders", {
      maxReminders,
    })
    .andWhere("user.incomplete_signup_next_reminder_at IS NOT NULL")
    .andWhere("user.incomplete_signup_next_reminder_at <= :now", { now })
    .orderBy("user.incomplete_signup_next_reminder_at", "ASC")
    .limit(getBatchSize())
    .getMany();

  for (const user of users) {
    try {
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
    } catch (error) {
      log.error(
        { err: error, userId: user.id, email: user.email },
        "Failed to send scheduled incomplete-signup reminder",
      );
    }
  }

  if (users.length > 0) {
    log.info(
      { count: users.length },
      "Processed incomplete-signup reminder emails",
    );
  }
};

export const startIncompleteSignupReminderScheduler = () => {
  const intervalMs = getScanIntervalMs();

  runIncompleteSignupReminderSweep().catch((error) => {
    log.error(
      { err: error },
      "Initial incomplete-signup reminder sweep failed",
    );
  });

  setInterval(() => {
    runIncompleteSignupReminderSweep().catch((error) => {
      log.error(
        { err: error },
        "Scheduled incomplete-signup reminder sweep failed",
      );
    });
  }, intervalMs);

  log.info({ intervalMs }, "Incomplete-signup reminder scheduler started");
};
