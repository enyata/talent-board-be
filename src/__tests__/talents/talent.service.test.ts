import { randomUUID } from "crypto";
import AppDataSource from "../../datasource";
import { MetricsEntity } from "../../entities/metrics.entity";
import { NotificationEntity } from "../../entities/notification.entity";
import { SavedTalentEntity } from "../../entities/savedTalent.entity";
import {
  ExperienceLevel,
  ProfileStatus,
  TalentProfileEntity,
} from "../../entities/talentProfile.entity";
import { UserEntity, UserProvider, UserRole } from "../../entities/user.entity";
import { ClientError } from "../../exceptions/clientError";
import { NotFoundError } from "../../exceptions/notFoundError";
import { TalentService } from "../../talents/talent.service";

const recruiterFactory = (email: string): Partial<UserEntity> => ({
  first_name: "Recruiter",
  last_name: "One",
  email,
  provider: UserProvider.GOOGLE,
  role: UserRole.RECRUITER,
  profile_completed: true,
});

const talentFactory = (email: string): Partial<UserEntity> => ({
  first_name: "Talent",
  last_name: "One",
  email,
  provider: UserProvider.GOOGLE,
  role: UserRole.TALENT,
  profile_completed: true,
});

describe("Talent Service", () => {
  let talentService: TalentService;

  beforeAll(async () => {
    await AppDataSource.initialize();
    talentService = new TalentService();
  });

  beforeEach(async () => {
    await AppDataSource.synchronize(true);
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  describe("saveTalent", () => {
    const nonExistentUUID = randomUUID();

    it("should throw ClientError if recruiter tries to save themselves", async () => {
      const id = "1234";
      await expect(talentService.saveTalent(id, id)).rejects.toThrow(
        ClientError,
      );
    });

    it("should throw NotFoundError if recruiter is missing", async () => {
      const userRepo = AppDataSource.getRepository(UserEntity);
      const talent = userRepo.create(talentFactory("t1@example.com"));
      await userRepo.save(talent);
      await expect(
        talentService.saveTalent(talent.id, nonExistentUUID),
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError if talent is missing or lacks profile", async () => {
      const userRepo = AppDataSource.getRepository(UserEntity);
      const recruiter = userRepo.create(recruiterFactory("r1@example.com"));
      await userRepo.save(recruiter);
      await expect(
        talentService.saveTalent(nonExistentUUID, recruiter.id),
      ).rejects.toThrow(NotFoundError);
    });

    it("should save a talent and create notification + increment metrics", async () => {
      const userRepo = AppDataSource.getRepository(UserEntity);
      const profileRepo = AppDataSource.getRepository(TalentProfileEntity);
      const saveRepo = AppDataSource.getRepository(SavedTalentEntity);
      const metricsRepo = AppDataSource.getRepository(MetricsEntity);
      const notificationRepo = AppDataSource.getRepository(NotificationEntity);

      const recruiter = userRepo.create(recruiterFactory("r2@example.com"));
      await userRepo.save(recruiter);

      const talent = userRepo.create(talentFactory("t2@example.com"));
      await userRepo.save(talent);

      const profile = profileRepo.create({
        user: talent,
        resume_path: "resume.pdf",
        portfolio_url: "https://portfolio.example.com",
        skills: ["TypeScript"],
        experience_level: ExperienceLevel.INTERMEDIATE,
        profile_status: ProfileStatus.APPROVED,
      });
      await profileRepo.save(profile);

      await talentService.saveTalent(talent.id, recruiter.id);

      const saved = await saveRepo.findOneBy({
        recruiter: { id: recruiter.id },
        talent: { id: talent.id },
      });
      const notification = await notificationRepo.findOneBy({
        recipient: { id: talent.id },
      });
      const metrics = await metricsRepo.findOneBy({ user: { id: talent.id } });

      expect(saved).toBeDefined();
      expect(notification).toBeDefined();
      expect(metrics?.recruiter_saves).toBe(1);
    });
  });
});
