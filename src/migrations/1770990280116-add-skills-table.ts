import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSkillsTable1770990280116 implements MigrationInterface {
  name = "AddSkillsTable1770990280116";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create Skills Table
    await queryRunner.query(`
      CREATE TABLE "skills" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "name" character varying(100) NOT NULL,
        CONSTRAINT "UQ_skills_name" UNIQUE ("name"),
        CONSTRAINT "PK_skills" PRIMARY KEY ("id")
      )
    `);

    // 2. Create Junction Table talent_skills
    await queryRunner.query(`
      CREATE TABLE "talent_skills" (
        "talent_profile_id" uuid NOT NULL,
        "skill_id" uuid NOT NULL,
        CONSTRAINT "PK_talent_skills" PRIMARY KEY ("talent_profile_id", "skill_id")
      )
    `);

    // 3. Add Indices for Junction Table
    await queryRunner.query(`
      CREATE INDEX "IDX_talent_skills_talent_profile_id" ON "talent_skills" ("talent_profile_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_talent_skills_skill_id" ON "talent_skills" ("skill_id")
    `);

    // 4. Add Foreign Keys for Junction Table
    await queryRunner.query(`
      ALTER TABLE "talent_skills" 
      ADD CONSTRAINT "FK_talent_skills_talent_profile" 
      FOREIGN KEY ("talent_profile_id") REFERENCES "talent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "talent_skills" 
      ADD CONSTRAINT "FK_talent_skills_skill" 
      FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `);

    // 5. Migrate existing skills
    const profiles = await queryRunner.query(
      `SELECT "id", "skills" FROM "talent_profiles"`,
    );

    for (const profile of profiles) {
      if (!profile.skills || !Array.isArray(profile.skills)) continue;

      for (const rawSkillName of profile.skills) {
        const trimmedName = rawSkillName.trim();
        if (!trimmedName) continue;

        // Check if skill exists (case-insensitive)
        const existingSkills = await queryRunner.query(
          `SELECT "id" FROM "skills" WHERE LOWER("name") = LOWER($1)`,
          [trimmedName],
        );

        let skillId;

        if (existingSkills.length > 0) {
          skillId = existingSkills[0].id;
        } else {
          // Create new skill

          const insertResult = await queryRunner.query(
            `INSERT INTO "skills" ("name") VALUES ($1) RETURNING "id"`,
            [trimmedName],
          );
          skillId = insertResult[0].id;
        }

        // Link skill to profile
        // Check if link exists (idempotency)
        const existingLink = await queryRunner.query(
          `SELECT 1 FROM "talent_skills" WHERE "talent_profile_id" = $1 AND "skill_id" = $2`,
          [profile.id, skillId],
        );

        if (existingLink.length === 0) {
          await queryRunner.query(
            `INSERT INTO "talent_skills" ("talent_profile_id", "skill_id") VALUES ($1, $2)`,
            [profile.id, skillId],
          );
        }
      }
    }

    // Drop skills_text from talent_profiles if exists
    await queryRunner.query(`
      ALTER TABLE "talent_profiles" DROP COLUMN IF EXISTS "skills_text"
    `);

    // Drop old skills array column if we want to fully replace it (as per previous conversation)
    // The previous code had `skills` as `text[]`.
    await queryRunner.query(`
        ALTER TABLE "talent_profiles" DROP COLUMN IF EXISTS "skills"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Re-add skills array column
    await queryRunner.query(`
        ALTER TABLE "talent_profiles" ADD COLUMN "skills" text array NOT NULL DEFAULT '{}'
    `);

    // 2. Re-add skills_text column
    await queryRunner.query(`
      ALTER TABLE "talent_profiles" ADD COLUMN "skills_text" text
    `);

    // 3. Drop Junction Table and Foreign Keys
    // FKs are dropped with table usually, but to be safe:
    // await queryRunner.query(`ALTER TABLE "talent_skills" DROP CONSTRAINT "FK_talent_skills_skill"`);
    // await queryRunner.query(`ALTER TABLE "talent_skills" DROP CONSTRAINT "FK_talent_skills_talent_profile"`);
    await queryRunner.query(`DROP TABLE "talent_skills"`);

    // 4. Drop Skills Table
    // await queryRunner.query(`ALTER TABLE "skills" DROP CONSTRAINT "FK_skills_created_by"`);
    await queryRunner.query(`DROP TABLE "skills"`);
  }
}
