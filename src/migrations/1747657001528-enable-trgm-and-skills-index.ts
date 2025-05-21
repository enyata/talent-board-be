import { MigrationInterface, QueryRunner } from "typeorm";

export class EnableTrgmAndSkillsIndex1747657001528
  implements MigrationInterface
{
  name = "EnableTrgmAndSkillsIndex1747657001528";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'talent_profiles'
          AND column_name = 'skills_text'
        ) THEN
          ALTER TABLE talent_profiles ADD COLUMN skills_text TEXT;
        END IF;
      END $$;
    `);

    await queryRunner.query(
      `UPDATE talent_profiles SET skills_text = array_to_string(skills, ' ')`,
    );

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_skills_trgm
      ON talent_profiles
      USING GIN (skills_text gin_trgm_ops);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_skills_trgm;`);
    await queryRunner.query(
      `ALTER TABLE talent_profiles DROP COLUMN IF EXISTS skills_text;`,
    );
    await queryRunner.query(`DROP EXTENSION IF EXISTS pg_trgm;`);
  }
}
