import { DataSource } from "typeorm";
import AppDataSource from "../datasource";
import {
  HiringFor,
  RecruiterProfileEntity,
} from "../entities/recruiterProfile.entity";
import {
  ExperienceLevel,
  TalentProfileEntity,
} from "../entities/talentProfile.entity";
import { UserEntity, UserProvider, UserRole } from "../entities/user.entity";
import log from "../utils/logger";

export const seedTestDatabase = async (dataSource: DataSource) => {
  const userRepo = dataSource.getRepository(UserEntity);
  const talentProfileRepo = dataSource.getRepository(TalentProfileEntity);
  const recruiterProfileRepo = dataSource.getRepository(RecruiterProfileEntity);

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
    provider: UserProvider.GOOGLE,
    role: UserRole.TALENT,
    profile_completed: true,
    state: "Lagos",
    country: "Nigeria",
    linkedin_profile: "https://linkedin.com/in/talent-user",
  });

  const recruiterUser = userRepo.create({
    first_name: "Google",
    last_name: "Recruiter",
    email: "recruiter@example.com",
    avatar: "https://example.com/recruiter-avatar.png",
    provider: UserProvider.GOOGLE,
    role: UserRole.RECRUITER,
    profile_completed: true,
    state: "Abuja",
    country: "Nigeria",
    linkedin_profile: "https://linkedin.com/in/recruiter-user",
  });

  await userRepo.save([talentUser, recruiterUser]);

  const talentProfile = talentProfileRepo.create({
    user: talentUser,
    resume_path: "uploads/resume/talent.pdf",
    portfolio_url: "https://portfolio.talent.dev",
    skills: ["JavaScript", "Node.js", "TypeScript"],
    experience_level: ExperienceLevel.INTERMEDIATE,
  });

  const recruiterProfile = recruiterProfileRepo.create({
    user: recruiterUser,
    work_email: "recruiter@company.com",
    company_industry: "Tech",
    roles_looking_for: ["Frontend Developer", "Backend Developer"],
    hiring_for: HiringFor.MYSELF,
  });

  await talentProfileRepo.save(talentProfile);
  await recruiterProfileRepo.save(recruiterProfile);

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
