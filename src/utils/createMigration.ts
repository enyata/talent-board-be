import fs from "fs";
import path from "path";
import log from "./logger";

const timestamp = Date.now();
const migrationName = process.argv[2];

if (!migrationName) {
  log.error(
    "❌ Please provide a migration name, e.g., `yarn create-migration add-user-table`",
  );
  process.exit(1);
}

const className = `${capitalize(toCamelCase(migrationName))}${timestamp}`;
const filename = `${timestamp}-${migrationName}.ts`;
const migrationsDir = path.join(__dirname, "../migrations");
const filePath = path.join(migrationsDir, filename);

const template = `import { MigrationInterface, QueryRunner } from "typeorm";

export class ${className} implements MigrationInterface {
  name = "${className}";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Write your migration SQL here
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback logic
  }
}
`;

fs.mkdirSync(migrationsDir, { recursive: true });
fs.writeFileSync(filePath, template);
log.info(`✅ Migration created: src/migrations/${filename}`);

function toCamelCase(input: string): string {
  return input.replace(/-([a-z])/g, (_, g) => g.toUpperCase());
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
