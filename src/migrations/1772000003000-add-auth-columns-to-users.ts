import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuthColumnsToUsers1772000003000 implements MigrationInterface {
  name = "AddAuthColumnsToUsers1772000003000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "password" character varying,
        ADD COLUMN IF NOT EXISTS "is_email_verified" boolean NOT NULL DEFAULT false;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE t.typname = 'users_provider_enum' AND e.enumlabel = 'local'
        ) THEN
          ALTER TYPE "public"."users_provider_enum" ADD VALUE 'local';
        END IF;
      END$$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN IF EXISTS "password",
        DROP COLUMN IF EXISTS "is_email_verified";
    `);
  }
}
