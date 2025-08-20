import { MigrationInterface, QueryRunner } from "typeorm";

export class TalentDashboardEntities1747251721737
  implements MigrationInterface
{
  name = "TalentDashboardEntities1747251721737";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Notification type enum
    await queryRunner.query(`
      CREATE TYPE "public"."notification_type_enum" AS ENUM('save', 'view', 'upvote', 'message')
    `);

    // Notifications table
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" "public"."notification_type_enum" NOT NULL,
        "message" character varying NOT NULL,
        "read" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "recipient_id" uuid,
        "sender_id" uuid,
        CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id")
      )
    `);

    // Metrics table
    await queryRunner.query(`
      CREATE TABLE "user_metrics" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "upvotes" integer NOT NULL DEFAULT 0,
        "profile_views" integer NOT NULL DEFAULT 0,
        "recruiter_saves" integer NOT NULL DEFAULT 0,
        "weekly_search_appearances" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "user_id" uuid,
        CONSTRAINT "PK_user_metrics_id" PRIMARY KEY ("id")
      )
    `);

    // Foreign key for metrics → user (one-to-one, owning side only)
    await queryRunner.query(`
      ALTER TABLE "user_metrics"
      ADD CONSTRAINT "FK_user_metrics_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    // Foreign keys for notifications → user (recipient and sender)
    await queryRunner.query(`
      ALTER TABLE "notifications"
      ADD CONSTRAINT "FK_notifications_recipient" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "notifications"
      ADD CONSTRAINT "FK_notifications_sender" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    // Talent profile status enum + field
    await queryRunner.query(`
      CREATE TYPE "public"."talent_profiles_profile_status_enum" AS ENUM('pending', 'under_review', 'approved', 'rejected')
    `);

    await queryRunner.query(`
      ALTER TABLE "talent_profiles"
      ADD COLUMN "profile_status" "public"."talent_profiles_profile_status_enum" DEFAULT 'pending'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "talent_profiles" DROP COLUMN "profile_status"
    `);

    await queryRunner.query(`
      DROP TYPE "public"."talent_profiles_profile_status_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_sender"
    `);

    await queryRunner.query(`
      ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_recipient"
    `);

    await queryRunner.query(`
      ALTER TABLE "user_metrics" DROP CONSTRAINT "FK_user_metrics_user"
    `);

    await queryRunner.query(`
      DROP TABLE "user_metrics"
    `);

    await queryRunner.query(`
      DROP TABLE "notifications"
    `);

    await queryRunner.query(`
      DROP TYPE "public"."notification_type_enum"
    `);
  }
}
