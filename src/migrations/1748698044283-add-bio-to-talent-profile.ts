import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBioToTalentProfile1748698044283 implements MigrationInterface {
  name = "AddBioToTalentProfile1748698044283";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'talent_profiles'
          AND column_name = 'bio'
        ) THEN
          ALTER TABLE talent_profiles ADD COLUMN bio TEXT;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE talent_profiles DROP COLUMN IF EXISTS bio;
    `);
  }
}
