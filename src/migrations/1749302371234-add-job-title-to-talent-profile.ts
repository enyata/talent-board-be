import { MigrationInterface, QueryRunner } from "typeorm";

export class AddJobTitleToTalentProfile1749302371234
  implements MigrationInterface
{
  name = "AddJobTitleToTalentProfile1749302371234";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'talent_profiles'
          AND column_name = 'job_title'
        ) THEN
          ALTER TABLE talent_profiles ADD COLUMN job_title VARCHAR NOT NULL DEFAULT 'Software Engineer';
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE talent_profiles DROP COLUMN IF EXISTS job_title;
    `);
  }
}
