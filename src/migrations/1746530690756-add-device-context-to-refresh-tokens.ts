import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeviceContextToRefreshTokens1746530690756
  implements MigrationInterface
{
  name = "AddDeviceContextToRefreshTokens1746530690756";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "refresh_tokens"
      ADD COLUMN "ip_address" character varying,
      ADD COLUMN "user_agent" character varying;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "refresh_tokens"
      DROP COLUMN "ip_address",
      DROP COLUMN "user_agent";
    `);
  }
}
