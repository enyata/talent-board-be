import { randomUUID } from "crypto";
import { DashboardService } from "../../dashboard/services/dashboard.service";
import AppDataSource from "../../datasource";
import { MetricsEntity } from "../../entities/metrics.entity";
import {
  NotificationEntity,
  NotificationType,
} from "../../entities/notification.entity";
import {
  ExperienceLevel,
  ProfileStatus,
  TalentProfileEntity,
} from "../../entities/talentProfile.entity";
import { UserEntity, UserProvider, UserRole } from "../../entities/user.entity";
import { NotFoundError } from "../../exceptions/notFoundError";
import { seedTestDatabase } from "../../seeders/testSeeder";

const talentFactory = (
  email = `talent-${Date.now()}@example.com`,
): Partial<UserEntity> => ({
  first_name: "Test",
  last_name: "Talent",
  email,
  provider: UserProvider.GOOGLE,
  role: UserRole.TALENT,
  profile_completed: true,
});

describe("DashboardService", () => {
  let dashboardService: DashboardService;

  beforeAll(async () => {
    await AppDataSource.initialize();
    dashboardService = new DashboardService();
  });

  beforeEach(async () => {
    await AppDataSource.synchronize(true);
    await seedTestDatabase(AppDataSource);
  });

  afterAll(async () => {
    await AppDataSource.destroy();
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

    const profile = talentProfileRepo.create({
      user: talent,
      resume_path: "path/to/resume.pdf",
      portfolio_url: "https://portfolio.example.com",
      skills: ["Node.js", "TypeScript"],
      experience_level: ExperienceLevel.INTERMEDIATE,
      profile_status: ProfileStatus.APPROVED,
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
});
