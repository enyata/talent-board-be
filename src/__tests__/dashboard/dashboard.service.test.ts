import { randomUUID } from "crypto";
import { Repository } from "typeorm";
import { DashboardService } from "../../dashboard/services/dashboard.service";
import AppDataSource from "../../datasource";
import { MetricsEntity } from "../../entities/metrics.entity";
import {
  NotificationEntity,
  NotificationType,
} from "../../entities/notification.entity";
import { SavedTalentEntity } from "../../entities/savedTalent.entity";
import {
  ExperienceLevel,
  ProfileStatus,
  TalentProfileEntity,
} from "../../entities/talentProfile.entity";
import { UserEntity, UserProvider, UserRole } from "../../entities/user.entity";
import { NotFoundError } from "../../exceptions/notFoundError";

const talentFactory = (
  email = `talent-${Date.now()}@example.com`,
): Partial<UserEntity> => ({
  first_name: "Test",
  last_name: "Talent",
  email,
  provider: UserProvider.GOOGLE,
  role: UserRole.TALENT,
  profile_completed: true,
  state: "Abuja",
  country: "Nigeria",
  linkedin_profile: "https://linkedin.com/in/talent",
});

const recruiterFactory = (
  email = `recruiter-${Date.now()}@example.com`,
): Partial<UserEntity> => ({
  first_name: "Recruiter",
  last_name: "Example",
  email,
  provider: UserProvider.GOOGLE,
  role: UserRole.RECRUITER,
  profile_completed: true,
  state: "Lagos",
  country: "Nigeria",
  linkedin_profile: "https://linkedin.com/in/recruiter",
});

describe("DashboardService", () => {
  let dashboardService: DashboardService;
  let userRepo: Repository<UserEntity>;

  beforeAll(async () => {
    await AppDataSource.initialize();
    dashboardService = new DashboardService();
    userRepo = AppDataSource.getRepository(UserEntity);
  });

  beforeEach(async () => {
    await AppDataSource.synchronize(true);
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  it("should throw NotFoundError if user or talent profile is not found", async () => {
    const nonExistentUUID = randomUUID();
    await expect(
      dashboardService.getTalentDashboard(nonExistentUUID),
    ).rejects.toThrow(NotFoundError);
  });

  it("should return correct dashboard data for a valid talent user", async () => {
    const userRepo = AppDataSource.getRepository(UserEntity);
    const talentProfileRepo = AppDataSource.getRepository(TalentProfileEntity);
    const metricsRepo = AppDataSource.getRepository(MetricsEntity);
    const notificationRepo = AppDataSource.getRepository(NotificationEntity);

    const talent = userRepo.create(talentFactory());
    await userRepo.save(talent);

    const skills = ["Node.js", "TypeScript"];
    const profile = talentProfileRepo.create({
      user: talent,
      resume_path: "path/to/resume.pdf",
      portfolio_url: "https://portfolio.example.com",
      skills,
      skills_text: skills.join(" "),
      experience_level: ExperienceLevel.INTERMEDIATE,
      profile_status: ProfileStatus.APPROVED,
      job_title: "Software developer",
      bio: "I am a passionate developer",
    });
    await talentProfileRepo.save(profile);

    const metrics = metricsRepo.create({
      user: talent,
      upvotes: 10,
      profile_views: 25,
      recruiter_saves: 5,
      weekly_search_appearances: 12,
    });
    await metricsRepo.save(metrics);

    const notification = notificationRepo.create({
      type: NotificationType.UPVOTE,
      message: "You got an upvote!",
      read: false,
      sender: talent,
      recipient: talent,
    });
    await notificationRepo.save(notification);

    const data = await dashboardService.getTalentDashboard(talent.id);

    expect(data).toHaveProperty("profile_status", "approved");
    expect(data).toHaveProperty("total_upvotes", 10);
    expect(data).toHaveProperty("profile_views", 25);
    expect(data).toHaveProperty("recruiter_saves", 5);
    expect(data).toHaveProperty("search_appearances", 12);
    expect(data.notifications.length).toBeGreaterThanOrEqual(1);
    expect(data.notifications[0]).toHaveProperty("message");
    expect(data.notifications[0]).toHaveProperty("sender");
  });

  it("should throw NotFoundError if recruiter profile is missing", async () => {
    const userRepo = AppDataSource.getRepository(UserEntity);
    const recruiter = userRepo.create(recruiterFactory());
    await userRepo.save(recruiter);

    await expect(
      dashboardService.getRecruiterDashboard(recruiter.id),
    ).rejects.toThrow(NotFoundError);
  });

  it("should return dashboard with saved talent and proper serialization", async () => {
    const profileRepo = AppDataSource.getRepository(TalentProfileEntity);
    const saveRepo = AppDataSource.getRepository(SavedTalentEntity);

    const recruiter = userRepo.create(recruiterFactory("r1@example.com"));
    await userRepo.save(recruiter);

    await AppDataSource.query(
      `
      INSERT INTO recruiter_profiles (
        id, user_id, work_email, company_industry, roles_looking_for, hiring_for, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, 'recruiter@company.com', 'Tech', ARRAY['Backend Developer'], 'myself', now(), now()
      )
    `,
      [recruiter.id],
    );

    const talent = userRepo.create(talentFactory("t1@example.com"));
    await userRepo.save(talent);

    const skills = ["Node.js", "React"];
    const talentProfile = profileRepo.create({
      user: talent,
      resume_path: "path/to/resume.pdf",
      portfolio_url: "https://portfolio.talent.com",
      skills,
      skills_text: skills.join(" "),
      experience_level: ExperienceLevel.EXPERT,
      profile_status: ProfileStatus.APPROVED,
      job_title: "Software developer",
      bio: "I am a passionate developer",
    });
    await profileRepo.save(talentProfile);

    const save = saveRepo.create({
      recruiter,
      talent,
      saved_at: new Date(),
    });
    await saveRepo.save(save);

    const dashboard = await dashboardService.getRecruiterDashboard(
      recruiter.id,
    );

    expect(dashboard).toHaveProperty("welcome_message");
    expect(dashboard.saved_talents).toHaveLength(1);
    expect(dashboard.saved_talents[0]).toMatchObject({
      first_name: "Test",
      last_name: "Talent",
      avatar: talent.avatar,
      skills: ["Node.js", "React"],
      portfolio_url: "https://portfolio.talent.com",
      experience_level: "expert",
    });
  });
});
