import { randomUUID } from "crypto";
import AppDataSource, { initializeDataSource } from "../../datasource";
import { MetricsEntity } from "../../entities/metrics.entity";
import { NotificationEntity } from "../../entities/notification.entity";
import { SavedTalentEntity } from "../../entities/savedTalent.entity";
import {
  ExperienceLevel,
  ProfileStatus,
  TalentProfileEntity,
} from "../../entities/talentProfile.entity";
import { TalentUpvoteEntity } from "../../entities/talentUpvote.entity";
import { UserEntity, UserProvider, UserRole } from "../../entities/user.entity";
import { ClientError } from "../../exceptions/clientError";
import { NotFoundError } from "../../exceptions/notFoundError";
import { TalentService } from "../../talents/services/talent.service";
import { resolveAssetUrl } from "../../utils/resolveAssetUrl";

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

const insertOrUpdateMetrics = async (
  userId: string,
  updates: Partial<MetricsEntity>,
) => {
  const repo = AppDataSource.getRepository(MetricsEntity);
  let metrics = await repo.findOne({
    where: { user: { id: userId } },
    relations: ["user"],
  });

  if (!metrics) {
    const user = await AppDataSource.getRepository(UserEntity).findOneByOrFail({
      id: userId,
    });
    metrics = repo.create({ user });
  }

  Object.assign(metrics, updates);

  const raw = repo.create(metrics);
  await repo.save(raw);
};

describe("Talent Service", () => {
  let talentService: TalentService;

  beforeAll(async () => {
    await initializeDataSource();
    talentService = new TalentService();
  });

  beforeEach(async () => {
    await AppDataSource.synchronize(true);
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  const setupUsers = async (
    talentOverrides: Partial<TalentProfileEntity> = {},
    userOverrides: Partial<UserEntity> = {},
  ) => {
    const userRepo = AppDataSource.getRepository(UserEntity);
    const profileRepo = AppDataSource.getRepository(TalentProfileEntity);
    const unique = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const recruiter = userRepo.create({
      first_name: "Recruiter",
      last_name: "One",
      email: `recruiter-${unique}@test.com`,
      provider: UserProvider.GOOGLE,
      role: UserRole.RECRUITER,
      profile_completed: true,
    });
    await userRepo.save(recruiter);

    const talent = userRepo.create({
      first_name: "Talent",
      last_name: "User",
      email: `talent-${unique}@test.com`,
      provider: UserProvider.GOOGLE,
      role: UserRole.TALENT,
      profile_completed: true,
      ...userOverrides,
    });
    await userRepo.save(talent);

    const skills = talentOverrides.skills || ["React"];
    const profile = profileRepo.create({
      user: talent,
      resume_path: "resume.pdf",
      skills,
      skills_text: skills.join(" "),
      experience_level: ExperienceLevel.INTERMEDIATE,
      profile_status: ProfileStatus.APPROVED,
      job_title: "software developer",
      bio: "I am passionate developer",
      ...talentOverrides,
    });
    await profileRepo.save(profile);

    await AppDataSource.query(
      `UPDATE talent_profiles SET skills_text = array_to_string(skills, ' ') WHERE user_id = $1`,
      [talent.id],
    );

    const metricsRepo = AppDataSource.getRepository(MetricsEntity);
    const existing = await metricsRepo.findOne({
      where: { user: { id: talent.id } },
    });
    if (!existing) {
      const metrics = metricsRepo.create({ user: talent });
      await metricsRepo.save(metrics);
    }

    return { recruiter, talent };
  };

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
      const saveRepo = AppDataSource.getRepository(SavedTalentEntity);
      const metricsRepo = AppDataSource.getRepository(MetricsEntity);
      const notificationRepo = AppDataSource.getRepository(NotificationEntity);

      const { recruiter, talent } = await setupUsers(
        { skills: ["TypeScript"] },
        { email: "t2@example.com" },
      );

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
    it("returns empty if no talents exist", async () => {
      const res = await talentService.searchTalents({ limit: 10 });
      expect(res.results).toHaveLength(0);
    });

    it("returns matching talents based on keyword q", async () => {
      await setupUsers({ skills: ["React"] });
      await setupUsers({ skills: ["Vue"] });

      const res = await talentService.searchTalents({
        skills: ["React"],
        limit: 10,
      });

      const skillHits = res.results.flatMap((r) =>
        (r.skills ?? []).map((s: string) => s.toLowerCase()),
      );
      expect(skillHits).toEqual(expect.arrayContaining(["react"]));
    });

    it("filters by skills array and experience", async () => {
      await setupUsers({
        skills: ["Node.js", "TypeScript"],
        experience_level: ExperienceLevel.EXPERT,
      });
      await setupUsers({
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
      await setupUsers({}, { state: "Lagos", country: "Nigeria" });
      await setupUsers({}, { state: "Accra", country: "Ghana" });

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
      for (let i = 0; i < 2; i++) {
        await setupUsers({}, { created_at: new Date(base + i * 1000) });
      }
      const res = await talentService.searchTalents({
        sort: "recent",
        limit: 2,
      });
      expect(res.results.length).toBeLessThanOrEqual(2);
    });

    it("supports cursor-based pagination", async () => {
      const base = Date.now();
      const inserted: Array<{ recruiter: UserEntity; talent: UserEntity }> = [];
      for (let i = 0; i < 4; i++) {
        const record = await setupUsers(
          {},
          { created_at: new Date(base + i * 10000) },
        );
        inserted.push(record);
      }

      const sortedInserted = inserted
        .map((r) => r.talent)
        .sort(
          (a, b) =>
            a.created_at.getTime() - a.created_at.getTime() ||
            b.id.localeCompare(b.id),
        );

      const firstPage = await talentService.searchTalents({
        limit: 2,
        sort: "recent",
      });
      expect(firstPage.results.length).toBe(2);
      expect(firstPage.results.map((r) => r.id)).toEqual([
        sortedInserted[0].id,
        sortedInserted[1].id,
      ]);

      const secondPage = await talentService.searchTalents({
        limit: 2,
        cursor: firstPage.nextCursor ?? "",
        direction: "next",
        sort: "recent",
      });
      expect(secondPage.results.length).toBe(2);
      expect(secondPage.results.map((r) => r.id)).toEqual([
        sortedInserted[2].id,
        sortedInserted[3].id,
      ]);
    });

    it("applies sort by upvotes", async () => {
      const t1 = await setupUsers();
      const t2 = await setupUsers();
      await insertOrUpdateMetrics(t1.talent.id, { upvotes: 2 });
      await insertOrUpdateMetrics(t2.talent.id, { upvotes: 5 });

      const res = await talentService.searchTalents({
        sort: "upvotes",
        limit: 10,
      });
      const ids = res.results.map((r) => r.id);
      expect(ids.indexOf(t2.talent.id)).toBeLessThan(ids.indexOf(t1.talent.id));
    });

    it("returns safe default if sort key is invalid", async () => {
      const res = await talentService.searchTalents({
        sort: "invalid" as any,
        limit: 10,
      });
      expect(Array.isArray(res.results)).toBe(true);
    });

    it("returns safe default if cursor is invalid", async () => {
      const res = await talentService.searchTalents({
        cursor: "%%%",
        limit: 10,
      });
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
      const { talent } = await setupUsers(
        {
          resume_path: "jane-resume.pdf",
          portfolio_url: "https://jane.dev",
          skills: ["React", "Node.js"],
          experience_level: ExperienceLevel.INTERMEDIATE,
        },
        {
          first_name: "Jane",
          last_name: "Doe",
          email: "jane@doe.com",
        },
      );

      await insertOrUpdateMetrics(talent.id, {
        upvotes: 5,
        recruiter_saves: 2,
      });

      const result = await talentService.getTalentById(talent.id);

      expect(result).toMatchObject({
        id: talent.id,
        first_name: "Jane",
        last_name: "Doe",
        resume_path: resolveAssetUrl("jane-resume.pdf"),
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

  describe("toggleUpvoteTalent", () => {
    it("should throw ClientError if recruiter tries to upvote themselves", async () => {
      await expect(
        talentService.toggleUpvoteTalent("same-id", "same-id"),
      ).rejects.toThrow(ClientError);
    });

    it("should throw NotFoundError if talent not found or not approved", async () => {
      const userRepo = AppDataSource.getRepository(UserEntity);
      const recruiter = userRepo.create({
        first_name: "Rec",
        last_name: "One",
        email: "rec@test.com",
        provider: UserProvider.GOOGLE,
        role: UserRole.RECRUITER,
        profile_completed: true,
      });
      await userRepo.save(recruiter);

      await expect(
        talentService.toggleUpvoteTalent(randomUUID(), recruiter.id),
      ).rejects.toThrow(NotFoundError);
    });

    it("should upvote a talent, create record, metric and notification", async () => {
      const { recruiter, talent } = await setupUsers();

      const action = await talentService.toggleUpvoteTalent(
        talent.id,
        recruiter.id,
      );
      expect(action).toBe("upvoted");

      const upvote = await AppDataSource.getRepository(
        TalentUpvoteEntity,
      ).findOne({
        where: {
          recruiter: { id: recruiter.id },
          talent: { id: talent.id },
        },
      });
      expect(upvote).toBeDefined();

      const metrics = await AppDataSource.getRepository(
        MetricsEntity,
      ).findOneBy({
        user: { id: talent.id },
      });
      expect(metrics?.upvotes).toBe(1);

      const notification = await AppDataSource.getRepository(
        NotificationEntity,
      ).findOneBy({
        recipient: { id: talent.id },
        sender: { id: recruiter.id },
      });
      expect(notification).toBeDefined();
    });

    it("should unupvote a previously upvoted talent", async () => {
      const { recruiter, talent } = await setupUsers();
      await talentService.toggleUpvoteTalent(talent.id, recruiter.id); // Upvote

      const action = await talentService.toggleUpvoteTalent(
        talent.id,
        recruiter.id,
      ); // Unupvote
      expect(action).toBe("unupvoted");

      const upvote = await AppDataSource.getRepository(
        TalentUpvoteEntity,
      ).findOne({
        where: {
          recruiter: { id: recruiter.id },
          talent: { id: talent.id },
        },
      });
      expect(upvote).toBeNull();

      const metrics = await AppDataSource.getRepository(
        MetricsEntity,
      ).findOneBy({
        user: { id: talent.id },
      });
      expect(metrics?.upvotes).toBe(0);
    });
  });

  describe("getSavedTalents", () => {
    it("returns only saved talents for the recruiter", async () => {
      const { recruiter, talent } = await setupUsers();
      await talentService.saveTalent(talent.id, recruiter.id);

      const res = await talentService.getSavedTalents(recruiter.id, {
        limit: 10,
      });

      expect(res.results).toHaveLength(1);
      expect(res.results[0].id).toBe(talent.id);
    });

    it("applies sort by upvotes in saved talents", async () => {
      const t1 = await setupUsers();
      const t2 = await setupUsers();
      await talentService.saveTalent(t1.talent.id, t1.recruiter.id);
      await talentService.saveTalent(t2.talent.id, t2.recruiter.id);
      await insertOrUpdateMetrics(t1.talent.id, { upvotes: 2 });
      await insertOrUpdateMetrics(t2.talent.id, { upvotes: 5 });

      const res = await talentService.getSavedTalents(t1.recruiter.id, {
        sort: "upvotes",
        limit: 10,
      });

      const ids = res.results.map((r) => r.id);
      expect(ids.indexOf(t2.talent.id)).toBeLessThan(ids.indexOf(t1.talent.id));
    });

    it("supports pagination with cursors in saved talents", async () => {
      const base = Date.now();
      const userRepo = AppDataSource.getRepository(UserEntity);
      const recruiter = userRepo.create({
        first_name: "Recruiter",
        last_name: "Pagination",
        email: `recruiter-pagination-${Date.now()}@test.com`,
        provider: UserProvider.GOOGLE,
        role: UserRole.RECRUITER,
        profile_completed: true,
      });
      await userRepo.save(recruiter);

      const records: UserEntity[] = [];

      for (let i = 0; i < 4; i++) {
        const { talent } = await setupUsers(
          {},
          { created_at: new Date(base + i * 10000) },
        );
        await talentService.saveTalent(talent.id, recruiter.id);
        records.push(talent);
      }

      const sorted = records.sort(
        (a, b) =>
          a.created_at.getTime() - b.created_at.getTime() ||
          a.id.localeCompare(b.id),
      );

      const firstPage = await talentService.getSavedTalents(recruiter.id, {
        limit: 2,
        sort: "recent",
      });

      const secondPage = await talentService.getSavedTalents(recruiter.id, {
        limit: 2,
        cursor: firstPage.nextCursor ?? "",
        direction: "next",
        sort: "recent",
      });

      expect(firstPage.results).toHaveLength(2);
      expect(secondPage.results).toHaveLength(2);
      expect([
        ...firstPage.results.map((r) => r.id),
        ...secondPage.results.map((r) => r.id),
      ]).toEqual(sorted.map((r) => r.id));
    });
  });
});
