import { MigrationInterface, QueryRunner } from "typeorm";

export class Onboarding1746228962929 implements MigrationInterface {
  name = "Onboarding1746228962929";
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
    CREATE TYPE "public"."users_experience_level_enum" AS ENUM('entry', 'intermediate', 'expert');
    
    ALTER TABLE "users"
      ADD COLUMN "location" character varying,
      ADD COLUMN "portfolio_url" character varying,
      ADD COLUMN "linkedin_profile" character varying,
      ADD COLUMN "resume_path" character varying,
      ADD COLUMN "skills" text[],
      ADD COLUMN "experience_level" "public"."users_experience_level_enum",
      ADD COLUMN "work_email" character varying,
      ADD COLUMN "company_industry" character varying,
      ADD COLUMN "roles_looking_for" text[];
  `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
    ALTER TABLE "users"
      DROP COLUMN "location",
      DROP COLUMN "portfolio_url",
      DROP COLUMN "linkedin_profile",
      DROP COLUMN "resume_path",
      DROP COLUMN "skills",
      DROP COLUMN "experience_level",
      DROP COLUMN "work_email",
      DROP COLUMN "company_industry",
      DROP COLUMN "roles_looking_for";

    DROP TYPE "public"."users_experience_level_enum";
  `);
  }
}
