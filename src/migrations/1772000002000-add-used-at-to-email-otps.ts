import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUsedAtToEmailOtps1772000002000 implements MigrationInterface {
  name = "AddUsedAtToEmailOtps1772000002000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "email_otps"
      ADD COLUMN "used_at" TIMESTAMP NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "email_otps"
      DROP COLUMN "used_at";
    `);
  }
}
