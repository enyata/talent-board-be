import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMessagingFoundation1785264000000 implements MigrationInterface {
  name = "AddMessagingFoundation1785264000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."message_requests_status_enum" AS ENUM('pending', 'accepted', 'declined');

      CREATE TABLE "message_requests" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "intro_note" text,
        "status" "public"."message_requests_status_enum" NOT NULL DEFAULT 'pending',
        "responded_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "recruiter_id" uuid NOT NULL,
        "talent_id" uuid NOT NULL,
        CONSTRAINT "PK_message_requests_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_message_requests_recruiter" FOREIGN KEY ("recruiter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_message_requests_talent" FOREIGN KEY ("talent_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      );

      CREATE INDEX "IDX_message_requests_recruiter_talent_status" ON "message_requests" ("recruiter_id", "talent_id", "status");
      CREATE UNIQUE INDEX "UQ_message_requests_pending_recruiter_talent" ON "message_requests" ("recruiter_id", "talent_id") WHERE "status" = 'pending' AND "deleted_at" IS NULL;

      CREATE TABLE "conversation_threads" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "recruiter_last_seen_at" TIMESTAMP,
        "talent_last_seen_at" TIMESTAMP,
        "latest_message_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "recruiter_id" uuid NOT NULL,
        "talent_id" uuid NOT NULL,
        "accepted_request_id" uuid,
        CONSTRAINT "PK_conversation_threads_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_conversation_threads_recruiter_talent" UNIQUE ("recruiter_id", "talent_id"),
        CONSTRAINT "UQ_conversation_threads_accepted_request" UNIQUE ("accepted_request_id"),
        CONSTRAINT "FK_conversation_threads_recruiter" FOREIGN KEY ("recruiter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_conversation_threads_talent" FOREIGN KEY ("talent_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_conversation_threads_accepted_request" FOREIGN KEY ("accepted_request_id") REFERENCES "message_requests"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      );

      CREATE INDEX "IDX_conversation_threads_recruiter_latest" ON "conversation_threads" ("recruiter_id", "latest_message_at");
      CREATE INDEX "IDX_conversation_threads_talent_latest" ON "conversation_threads" ("talent_id", "latest_message_at");

      CREATE TABLE "messages" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "body" text NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "thread_id" uuid NOT NULL,
        "sender_id" uuid NOT NULL,
        "source_request_id" uuid,
        CONSTRAINT "PK_messages_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_messages_thread" FOREIGN KEY ("thread_id") REFERENCES "conversation_threads"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_messages_sender" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_messages_source_request" FOREIGN KEY ("source_request_id") REFERENCES "message_requests"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      );

      CREATE INDEX "IDX_messages_thread_created_at" ON "messages" ("thread_id", "created_at");
      CREATE INDEX "IDX_messages_sender" ON "messages" ("sender_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_messages_sender";
      DROP INDEX IF EXISTS "IDX_messages_thread_created_at";
      DROP TABLE IF EXISTS "messages";

      DROP INDEX IF EXISTS "IDX_conversation_threads_talent_latest";
      DROP INDEX IF EXISTS "IDX_conversation_threads_recruiter_latest";
      DROP TABLE IF EXISTS "conversation_threads";

      DROP INDEX IF EXISTS "UQ_message_requests_pending_recruiter_talent";
      DROP INDEX IF EXISTS "IDX_message_requests_recruiter_talent_status";
      DROP TABLE IF EXISTS "message_requests";

      DROP TYPE IF EXISTS "public"."message_requests_status_enum";
    `);
  }
}
