import { MigrationInterface, QueryRunner } from "typeorm";

export class Onboarding1746228962929 implements MigrationInterface {
  name = "Onboarding1746228962929";
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."users_provider_enum" AS ENUM('google', 'linkedin');
      CREATE TYPE "public"."users_role_enum" AS ENUM('talent', 'recruiter');
      CREATE TYPE "public"."users_experience_level_enum" AS ENUM('entry', 'intermediate', 'expert');

      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "first_name" character varying NOT NULL,
        "last_name" character varying NOT NULL,
        "email" character varying NOT NULL,
        "avatar" character varying,
        "provider" "public"."users_provider_enum" NOT NULL,
        "role" "public"."users_role_enum",
        "profile_completed" boolean NOT NULL DEFAULT false,

        -- Onboarding fields (all nullable)
        "location" character varying,
        "portfolio_url" character varying,
        "linkedin_profile" character varying,
        "resume_path" character varying,
        "skills" text,
        "experience_level" "public"."users_experience_level_enum",
        "work_email" character varying,
        "company_industry" character varying,
        "roles_looking_for" text,

        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,

        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      );

      CREATE TABLE "refresh_tokens" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "token" text NOT NULL,
        "is_valid" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "user_id" uuid,
        CONSTRAINT "PK_refresh_tokens_id" PRIMARY KEY ("id")
      );

      ALTER TABLE "refresh_tokens"
        ADD CONSTRAINT "FK_refresh_tokens_user_id" FOREIGN KEY ("user_id")
        REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_refresh_tokens_user_id";
      DROP TABLE "refresh_tokens";
      DROP TABLE "users";
      DROP TYPE "public"."users_experience_level_enum";
      DROP TYPE "public"."users_role_enum";
      DROP TYPE "public"."users_provider_enum";
    `);
  }
}
