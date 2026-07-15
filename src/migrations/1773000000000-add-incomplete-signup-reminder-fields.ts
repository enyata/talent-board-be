import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIncompleteSignupReminderFields1773000000000
  implements MigrationInterface
{
  name = "AddIncompleteSignupReminderFields1773000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "incomplete_signup_last_reminder_at" TIMESTAMP NULL,
      ADD COLUMN IF NOT EXISTS "incomplete_signup_next_reminder_at" TIMESTAMP NULL,
      ADD COLUMN IF NOT EXISTS "incomplete_signup_reminder_count" integer NOT NULL DEFAULT 0;
    `);

    await queryRunner.query(`
      UPDATE "users"
      SET "incomplete_signup_next_reminder_at" = NOW() + INTERVAL '1 day'
      WHERE "profile_completed" = false
        AND "incomplete_signup_next_reminder_at" IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "incomplete_signup_reminder_count",
      DROP COLUMN IF EXISTS "incomplete_signup_next_reminder_at",
      DROP COLUMN IF EXISTS "incomplete_signup_last_reminder_at";
    `);
  }
}
