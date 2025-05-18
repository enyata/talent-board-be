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

  describe("searchTalents", () => {
    const createTalent = async (
      email: string,
      opts: Partial<TalentProfileEntity> = {},
      userOpts: Partial<UserEntity> = {},
    ) => {
      const userRepo = AppDataSource.getRepository(UserEntity);
      const profileRepo = AppDataSource.getRepository(TalentProfileEntity);
      const talent = userRepo.create({
        ...talentFactory(email),
        ...userOpts,
      });
      await userRepo.save(talent);
      const profile = profileRepo.create({
        user: talent,
        resume_path: opts.resume_path || "cv.pdf",
        skills: opts.skills || ["TypeScript", "Node.js"],
        experience_level: opts.experience_level || ExperienceLevel.INTERMEDIATE,
        profile_status: opts.profile_status || ProfileStatus.APPROVED,
        ...opts,
      });
      await profileRepo.save(profile);
      return { talent, profile };
    };

    it("returns empty if no talents exist", async () => {
      const res = await talentService.searchTalents({ limit: 10 });
      expect(res.results).toHaveLength(0);
    });

    it("returns matching talents based on keyword q", async () => {
      await createTalent("match1@test.com");
      await createTalent("match2@test.com", { skills: ["React", "Node.js"] });

      let res = await talentService.searchTalents({ q: "Talent", limit: 10 });
      expect(res.results.length).toBeGreaterThanOrEqual(2);

      res = await talentService.searchTalents({ q: "react", limit: 10 });
      expect(res.results.some((r) => r.skills.includes("React"))).toBe(true);
    });

    it("filters by skills array and experience", async () => {
      await createTalent("filt1@test.com", {
        skills: ["Node.js", "TypeScript"],
        experience_level: ExperienceLevel.EXPERT,
      });
      await createTalent("filt2@test.com", {
        skills: ["React"],
        experience_level: ExperienceLevel.ENTRY,
      });

      const res = await talentService.searchTalents({
        skills: ["Node.js"],
        experience: ExperienceLevel.EXPERT,
        limit: 10,
      });
      expect(res.results).toHaveLength(1);
      expect(res.results[0].skills).toContain("Node.js");
      expect(res.results[0].experience_level).toBe(ExperienceLevel.EXPERT);
    });

    it("applies state and country filters", async () => {
      await createTalent(
        "loc1@test.com",
        {},
        { state: "Lagos", country: "Nigeria" },
      );
      await createTalent(
        "loc2@test.com",
        {},
        { state: "Accra", country: "Ghana" },
      );

      let res = await talentService.searchTalents({
        state: "Lagos",
        limit: 10,
      });
      expect(res.results).toHaveLength(1);
      expect(res.results[0].state).toBe("Lagos");
      res = await talentService.searchTalents({ country: "Ghana", limit: 10 });
      expect(res.results).toHaveLength(1);
      expect(res.results[0].country).toBe("Ghana");
    });

    it("applies sort and limit", async () => {
      const base = Date.now();
      for (let i = 1; i <= 5; i++) {
        await createTalent(
          `sort${i}@test.com`,
          {
            skills: ["TypeScript"],
            experience_level: ExperienceLevel.INTERMEDIATE,
          },
          { first_name: `User${i}`, created_at: new Date(base + i * 1000) },
        );
      }
      const res = await talentService.searchTalents({
        sort: "recent",
        limit: 2,
      });
      expect(res.results.length).toBeLessThanOrEqual(2);
    });

    it("supports cursor-based pagination", async () => {
      const base = Date.now();
      for (let i = 0; i < 3; i++) {
        await createTalent(
          `page${i}@test.com`,
          {
            skills: ["Node.js"],
            experience_level: ExperienceLevel.INTERMEDIATE,
          },
          { created_at: new Date(base + i * 1000) },
        );
      }
      const serviceRes = await talentService.searchTalents({ limit: 2 });
      expect(serviceRes.results.length).toBe(2);
      expect(serviceRes.nextCursor).toBeTruthy();
      const serviceRes2 = await talentService.searchTalents({
        limit: 2,
        cursor: serviceRes.nextCursor || undefined,
        direction: "next",
      });
      expect(serviceRes2.results.length).toBeLessThanOrEqual(2);
    });

    it("applies sort by upvotes", async () => {
      const userRepo = AppDataSource.getRepository(UserEntity);
      const metricsRepo = AppDataSource.getRepository(MetricsEntity);

      const t1 = await createTalent("up1@test.com");
      const t2 = await createTalent("up2@test.com");

      await metricsRepo.save([
        metricsRepo.create({ user: t1.talent, upvotes: 2 }),
        metricsRepo.create({ user: t2.talent, upvotes: 5 }),
      ]);

      const res = await talentService.searchTalents({
        sort: "upvotes",
        limit: 10,
      });
      expect(res.results.length).toBeGreaterThanOrEqual(2);
      expect(res.results[0].id).toBe(t2.talent.id); // higher upvotes first
    });

    it("returns safe default if sort key is invalid", async () => {
      const res = await talentService.searchTalents({
        sort: "invalid" as any,
        limit: 10,
      });
      expect(res).toHaveProperty("results");
      expect(Array.isArray(res.results)).toBe(true);
    });

    it("throws on non-numeric limit", async () => {
      await expect(
        // @ts-expect-error
        talentService.searchTalents({ limit: "ten" }),
      ).rejects.toThrow();
    });

    it("returns safe default if cursor is invalid", async () => {
      const res = await talentService.searchTalents({
        cursor: "%%%",
        limit: 10,
      });
      expect(res).toHaveProperty("results");
      expect(Array.isArray(res.results)).toBe(true);
    });
  });

  describe("getTalentById", () => {
    it("throws NotFoundError if talent does not exist", async () => {
      const nonExistentUUID = randomUUID();
      await expect(
        talentService.getTalentById(nonExistentUUID),
      ).rejects.toThrow(NotFoundError);
    });

    it("throws NotFoundError if user exists but has no talent profile", async () => {
      const userRepo = AppDataSource.getRepository(UserEntity);
      const user = userRepo.create({
        first_name: "John",
        last_name: "Doe",
        email: "john@doe.com",
        provider: UserProvider.GOOGLE,
        role: UserRole.TALENT,
        profile_completed: true,
      });
      await userRepo.save(user);
      await expect(talentService.getTalentById(user.id)).rejects.toThrow(
        NotFoundError,
      );
    });

    it("returns full talent profile when user and profile exist", async () => {
      const userRepo = AppDataSource.getRepository(UserEntity);
      const profileRepo = AppDataSource.getRepository(TalentProfileEntity);
      const metricsRepo = AppDataSource.getRepository(MetricsEntity);

      const user = userRepo.create({
        first_name: "Jane",
        last_name: "Doe",
        email: "jane@doe.com",
        provider: UserProvider.GOOGLE,
        role: UserRole.TALENT,
        profile_completed: true,
      });
      await userRepo.save(user);

      const profile = profileRepo.create({
        user,
        resume_path: "jane-resume.pdf",
        portfolio_url: "https://jane.dev",
        skills: ["React", "Node.js"],
        experience_level: ExperienceLevel.INTERMEDIATE,
        profile_status: ProfileStatus.APPROVED,
      });
      await profileRepo.save(profile);

      const metrics = metricsRepo.create({
        user,
        upvotes: 5,
        recruiter_saves: 2,
      });
      await metricsRepo.save(metrics);

      const result = await talentService.getTalentById(user.id);

      expect(result).toMatchObject({
        id: user.id,
        first_name: "Jane",
        last_name: "Doe",
        resume_path: "jane-resume.pdf",
        portfolio_url: "https://jane.dev",
        skills: expect.arrayContaining(["React", "Node.js"]),
        experience_level: ExperienceLevel.INTERMEDIATE,
        metrics: {
          upvotes: 5,
          recruiter_saves: 2,
        },
      });
    });
  });
});
