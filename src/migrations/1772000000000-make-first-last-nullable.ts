import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeFirstLastNullable1772000000000 implements MigrationInterface {
  name = "MakeFirstLastNullable1772000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ALTER COLUMN "first_name" DROP NOT NULL,
        ALTER COLUMN "last_name" DROP NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Ensure no NULL values before setting NOT NULL
    await queryRunner.query(
      `UPDATE "users" SET "first_name" = '' WHERE "first_name" IS NULL;`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "last_name" = '' WHERE "last_name" IS NULL;`,
    );
    await queryRunner.query(`
      ALTER TABLE "users"
        ALTER COLUMN "first_name" SET NOT NULL,
        ALTER COLUMN "last_name" SET NOT NULL;
    `);
  }
}
