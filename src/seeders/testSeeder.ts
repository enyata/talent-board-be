import { DataSource } from "typeorm";
import AppDataSource from "../datasource";
import { MetricsEntity } from "../entities/metrics.entity";
import {
  NotificationEntity,
  NotificationType,
} from "../entities/notification.entity";
import {
  HiringFor,
  RecruiterProfileEntity,
} from "../entities/recruiterProfile.entity";
import { RefreshToken } from "../entities/refreshToken.entity";
import { SavedTalentEntity } from "../entities/savedTalent.entity";
import {
  ExperienceLevel,
  ProfileStatus,
  TalentProfileEntity,
} from "../entities/talentProfile.entity";
import { UserEntity, UserProvider, UserRole } from "../entities/user.entity";
import { signToken } from "../utils/jwt";
import log from "../utils/logger";

type SeedOptions = {
  skipIfExists?: boolean;
  seedMoreTalents?: boolean;
};

export const seedTestDatabase = async (
  dataSource: DataSource,
  options: SeedOptions = { skipIfExists: true, seedMoreTalents: true },
) => {
  const userRepo = dataSource.getRepository(UserEntity);
  const talentProfileRepo = dataSource.getRepository(TalentProfileEntity);
  const recruiterProfileRepo = dataSource.getRepository(RecruiterProfileEntity);
  const metricsRepo = dataSource.getRepository(MetricsEntity);
  const refreshTokenRepo = dataSource.getRepository(RefreshToken);
  const savedTalentRepo = dataSource.getRepository(SavedTalentEntity);
  const notificationRepo = dataSource.getRepository(NotificationEntity);

  if (options.skipIfExists) {
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
  }

  log.info(
    "Seeding users, profiles, metrics, tokens, saved talents, and notifications...",
  );

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

  const talentSkills = ["JavaScript", "Node.js", "TypeScript"];

  const talentProfile = talentProfileRepo.create({
    user: talentUser,
    resume_path: "uploads/resume/talent.pdf",
    portfolio_url: "https://portfolio.talent.dev",
    skills: talentSkills,
    skills_text: talentSkills.join(" "),
    experience_level: ExperienceLevel.INTERMEDIATE,
    profile_status: ProfileStatus.APPROVED,
    bio: "I am a passionate developer",
    job_title: "Software Developer",
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

  await metricsRepo.save(
    metricsRepo.create({ user: talentUser, upvotes: 5, recruiter_saves: 2 }),
  );

  const talentRefreshToken = signToken(
    talentUser.id,
    "refreshTokenPrivateKey",
    { expiresIn: "7d" },
  );
  const talentAccessToken = signToken(talentUser.id, "accessTokenPrivateKey", {
    expiresIn: "1h",
  });

  await refreshTokenRepo.save(
    refreshTokenRepo.create({
      token: talentRefreshToken,
      user: talentUser,
      is_valid: true,
      ip_address: "127.0.0.1",
      user_agent: "SeederScript",
    }),
  );

  const recruiterRefreshToken = signToken(
    recruiterUser.id,
    "refreshTokenPrivateKey",
    { expiresIn: "7d" },
  );
  const recruiterAccessToken = signToken(
    recruiterUser.id,
    "accessTokenPrivateKey",
    { expiresIn: "1h" },
  );

  await refreshTokenRepo.save(
    refreshTokenRepo.create({
      token: recruiterRefreshToken,
      user: recruiterUser,
      is_valid: true,
      ip_address: "127.0.0.1",
      user_agent: "SeederScript",
    }),
  );

  await savedTalentRepo.save(
    savedTalentRepo.create({
      recruiter: recruiterUser,
      talent: talentUser,
      saved_at: new Date(),
    }),
  );

  await notificationRepo.save(
    notificationRepo.create({
      sender: recruiterUser,
      recipient: talentUser,
      type: NotificationType.SAVE,
      message: `${recruiterUser.first_name} saved your profile.`,
      read: false,
    }),
  );

  const secondTalent = userRepo.create({
    first_name: "Jane",
    last_name: "Doe",
    email: "jane.talent@example.com",
    provider: UserProvider.LINKEDIN,
    role: UserRole.TALENT,
    profile_completed: true,
    avatar: "https://example.com/jane.png",
    state: "Kano",
    country: "Nigeria",
    linkedin_profile: "https://linkedin.com/in/jane-doe",
  });

  await userRepo.save(secondTalent);

  const janeSkills = ["Python", "FastAPI", "PostgreSQL"];

  await talentProfileRepo.save(
    talentProfileRepo.create({
      user: secondTalent,
      resume_path: "uploads/resume/jane.pdf",
      portfolio_url: "https://portfolio.jane.dev",
      skills: janeSkills,
      skills_text: janeSkills.join(" "),
      experience_level: ExperienceLevel.EXPERT,
      profile_status: ProfileStatus.APPROVED,
    }),
  );

  await metricsRepo.save(
    metricsRepo.create({ user: secondTalent, upvotes: 10, recruiter_saves: 3 }),
  );

  log.info("Seeding complete.");
  log.info("Access Tokens:");
  log.info("Talent:", talentAccessToken);
  log.info("Recruiter:", recruiterAccessToken);
};

if (require.main === module) {
  AppDataSource.initialize()
    .then(async (dataSource) => {
      await seedTestDatabase(dataSource, { skipIfExists: false });
      await dataSource.destroy();
    })
    .catch((error) => console.error("Seeding failed:", error));
}
