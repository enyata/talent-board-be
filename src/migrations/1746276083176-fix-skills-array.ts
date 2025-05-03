import { MigrationInterface, QueryRunner } from "typeorm";

export class FixSkillsArray1746276083176 implements MigrationInterface {
  name = "FixSkillsArray1746276083176";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "skills" TYPE text[] USING string_to_array("skills", ',');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "skills" TYPE text USING array_to_string("skills", ',');
    `);
  }
}
