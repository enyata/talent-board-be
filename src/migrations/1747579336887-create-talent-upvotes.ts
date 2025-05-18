import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTalentUpvotes1747579336887 implements MigrationInterface {
  name = "CreateTalentUpvotes1747579336887";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "talent_upvotes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "upvoted_at" TIMESTAMP NOT NULL DEFAULT now(),
        "recruiter_id" uuid NOT NULL,
        "talent_id" uuid NOT NULL,
        CONSTRAINT "PK_talent_upvotes_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_recruiter_talent" UNIQUE ("recruiter_id", "talent_id"),
        CONSTRAINT "FK_upvote_recruiter" FOREIGN KEY ("recruiter_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_upvote_talent" FOREIGN KEY ("talent_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "talent_upvotes"`);
  }
}
