import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEmailOtps1772000001000 implements MigrationInterface {
  name = "CreateEmailOtps1772000001000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "email_otps" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid,
        "email" VARCHAR NOT NULL,
        "otp" VARCHAR NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_email_otps_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_email_otps_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "email_otps";`);
  }
}
