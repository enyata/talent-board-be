import { DataSource } from "typeorm";
import AppDataSource from "../datasource";
import { UserEntity } from "../entities/user.entity";
import log from "../utils/logger";

export const seedTestDatabase = async (dataSource: DataSource) => {
  const userRepo = dataSource.getRepository(UserEntity);

  const existingUsers = await userRepo.find({
    where: [
      { email: "talent@example.com" },
      { email: "recruiter@example.com" },
    ],
  });

  if (existingUsers.length === 2) {
    log.info("Seed users already exist. Skipping seeding.");
    return;
  }

  log.info("Seeding Google talent and recruiter users...");

  const talentUser = userRepo.create({
    first_name: "Google",
    last_name: "Talent",
    email: "talent@example.com",
    avatar: "https://example.com/talent-avatar.png",
    provider: "google",
    role: "talent",
    profile_completed: false,
    refreshTokens: [],
  });

  const recruiterUser = userRepo.create({
    first_name: "Google",
    last_name: "Recruiter",
    email: "recruiter@example.com",
    avatar: "https://example.com/recruiter-avatar.png",
    provider: "google",
    role: "recruiter",
    profile_completed: false,
    refreshTokens: [],
  });

  await userRepo.save([talentUser, recruiterUser]);
  log.info("Seeding complete.");
};

if (require.main === module) {
  AppDataSource.initialize()
    .then(async (dataSource) => {
      await seedTestDatabase(dataSource);
      await dataSource.destroy();
    })
    .catch((error) => console.error("Seeding failed:", error));
}
