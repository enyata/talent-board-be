import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSavedTalentsTable1747364288301
  implements MigrationInterface
{
  name = "CreateSavedTalentsTable1747364288301";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "saved_talents" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "saved_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "recruiter_id" uuid NOT NULL,
        "talent_id" uuid NOT NULL,
        CONSTRAINT "PK_saved_talents_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_saved_talents_recruiter_talent" UNIQUE ("recruiter_id", "talent_id"),
        CONSTRAINT "FK_saved_talents_recruiter" FOREIGN KEY ("recruiter_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_saved_talents_talent" FOREIGN KEY ("talent_id") REFERENCES "users"("id") ON DELETE CASCADE
      );

      CREATE INDEX "IDX_saved_talents_recruiter" ON "saved_talents" ("recruiter_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "IDX_saved_talents_recruiter";
      DROP TABLE "saved_talents";
    `);
  }
}
