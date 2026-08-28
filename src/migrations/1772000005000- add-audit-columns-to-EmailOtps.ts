import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddAuditColumnsToEmailOtps1772000004000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("email_otps");

    if (!table?.findColumnByName("updated_at")) {
      await queryRunner.addColumn(
        "email_otps",
        new TableColumn({
          name: "updated_at",
          type: "timestamp",
          isNullable: false,
          default: "CURRENT_TIMESTAMP",
        }),
      );
    }

    if (!table?.findColumnByName("deleted_at")) {
      await queryRunner.addColumn(
        "email_otps",
        new TableColumn({
          name: "deleted_at",
          type: "timestamp",
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("email_otps");

    if (table?.findColumnByName("deleted_at")) {
      await queryRunner.dropColumn("email_otps", "deleted_at");
    }

    if (table?.findColumnByName("updated_at")) {
      await queryRunner.dropColumn("email_otps", "updated_at");
    }
  }
}
