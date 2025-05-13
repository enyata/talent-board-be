import { MigrationInterface, QueryRunner } from "typeorm";

export class SplitUserProfilesAndAdjustFields1747165812599
  implements MigrationInterface
{
  name = "SplitUserProfilesAndAdjustFields1747165812599";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add shared fields to users table
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN "state" VARCHAR,
        ADD COLUMN "country" VARCHAR,
        ADD COLUMN "linkedin_profile" VARCHAR;
    `);

    // Create experience level enum if not already created
    await queryRunner.query(`
      CREATE TYPE "public"."talent_profiles_experience_level_enum" AS ENUM('entry', 'intermediate', 'expert');
    `);

    // Create talent_profiles table
    await queryRunner.query(`
      CREATE TABLE "talent_profiles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "resume_path" VARCHAR NOT NULL,
        "portfolio_url" VARCHAR,
        "skills" TEXT[] NOT NULL,
        "experience_level" "public"."talent_profiles_experience_level_enum" NOT NULL,
        "user_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_talent_profiles_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_talent_profiles_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    // Create hiring enum
    await queryRunner.query(`
      CREATE TYPE "public"."recruiter_profiles_hiring_for_enum" AS ENUM('myself', 'my company');
    `);

    // Create recruiter_profiles table
    await queryRunner.query(`
      CREATE TABLE "recruiter_profiles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "work_email" VARCHAR NOT NULL,
        "company_industry" VARCHAR NOT NULL,
        "roles_looking_for" TEXT[] NOT NULL,
        "hiring_for" "public"."recruiter_profiles_hiring_for_enum" NOT NULL,
        "user_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_recruiter_profiles_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_recruiter_profiles_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    // Remove old profile-specific columns from users
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN IF EXISTS "resume_path",
        DROP COLUMN IF EXISTS "portfolio_url",
        DROP COLUMN IF EXISTS "skills",
        DROP COLUMN IF EXISTS "experience_level",
        DROP COLUMN IF EXISTS "work_email",
        DROP COLUMN IF EXISTS "company_industry",
        DROP COLUMN IF EXISTS "roles_looking_for";
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users"
      ADD COLUMN "resume_path" VARCHAR,
      ADD COLUMN "portfolio_url" VARCHAR,
      ADD COLUMN "skills" TEXT[],
      ADD COLUMN "experience_level" VARCHAR,
      ADD COLUMN "work_email" VARCHAR,
      ADD COLUMN "company_industry" VARCHAR,
      ADD COLUMN "roles_looking_for" TEXT[];
    `);

    await queryRunner.query(`DROP TABLE "talent_profiles";`);
    await queryRunner.query(`DROP TABLE "recruiter_profiles";`);

    await queryRunner.query(
      `DROP TYPE "public"."talent_profiles_experience_level_enum";`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."recruiter_profiles_hiring_for_enum";`,
    );

    await queryRunner.query(`ALTER TABLE "users"
      DROP COLUMN "state",
      DROP COLUMN "country",
      DROP COLUMN "linkedin_profile";
    `);
  }
}
