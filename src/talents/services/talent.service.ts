import { MetricsService } from "@src/dashboard/services/metrics.service";
import { NotificationService } from "@src/dashboard/services/notification.service";
import AppDataSource from "@src/datasource";
import { NotificationType } from "@src/entities/notification.entity";
import { SavedTalentEntity } from "@src/entities/savedTalent.entity";
import {
  ProfileStatus,
  TalentProfileEntity,
} from "@src/entities/talentProfile.entity";
import { TalentUpvoteEntity } from "@src/entities/talentUpvote.entity";
import { UserEntity, UserRole } from "@src/entities/user.entity";
import { ClientError } from "@src/exceptions/clientError";
import { NotFoundError } from "@src/exceptions/notFoundError";
import { PaginatedResponse, TalentSearchResult } from "@src/interfaces";
import { CacheService } from "@src/utils/cache.service";
import { SearchTalentsDto } from "../schemas/searchTalents.schema";
import {
  buildTalentQuery,
  encodeCursor,
  extractCursorFrom,
  formatTalentResult,
} from "../utils/talent.utils";

export class TalentService {
  private readonly userRepo = AppDataSource.getRepository(UserEntity);
  private readonly saveRepo = AppDataSource.getRepository(SavedTalentEntity);
  private readonly profileRepo =
    AppDataSource.getRepository(TalentProfileEntity);
  private readonly upvoteRepo = AppDataSource.getRepository(TalentUpvoteEntity);
  private readonly notificationService = new NotificationService();
  private readonly metricsService = new MetricsService();

  async saveTalent(talentId: string, recruiterId: string): Promise<void> {
    if (recruiterId === talentId) {
      throw new ClientError("You cannot save yourself");
    }

    const [recruiter, talent] = await Promise.all([
      this.userRepo.findOne({ where: { id: recruiterId } }),
      this.userRepo.findOne({
        where: { id: talentId },
        relations: ["talent_profile"],
      }),
    ]);

    if (!recruiter || recruiter.role !== "recruiter") {
      throw new NotFoundError("Recruiter not found or unauthorized");
    }
    if (!talent || !talent.talent_profile) {
      throw new NotFoundError("Talent not found");
    }

    const exists = await this.saveRepo.findOne({
      where: {
        recruiter: { id: recruiterId },
        talent: { id: talentId },
      },
    });
    if (exists) return;

    const savedTalent = this.saveRepo.create({
      recruiter,
      talent,
      saved_at: new Date(),
    });
    await this.saveRepo.save(savedTalent);

    await this.notificationService.sendNotification(
      NotificationType.SAVE,
      recruiterId,
      talentId,
    );

    await this.metricsService.incrementMetric(talentId, "recruiter_saves");

    await CacheService.del(`dashboard_talent_${recruiterId}`);
  }

  async searchTalents(
    query: SearchTalentsDto,
    recruiterId?: string,
  ): Promise<PaginatedResponse<Partial<TalentSearchResult>>> {
    const limit = Number(query.limit);
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10;

    const qb = this.profileRepo.createQueryBuilder("talent");
    buildTalentQuery(qb, query, "talent");
    qb.take(safeLimit);

    const results = await qb.getMany();

    let savedSet = new Set<string>();
    let upvotedSet = new Set<string>();

    if (recruiterId) {
      const [saves, upvotes] = await Promise.all([
        this.saveRepo.find({
          where: { recruiter: { id: recruiterId } },
          relations: ["talent"],
        }),
        this.upvoteRepo.find({
          where: { recruiter: { id: recruiterId } },
          relations: ["talent"],
        }),
      ]);
      savedSet = new Set(saves.map((s) => s.talent.id));
      upvotedSet = new Set(upvotes.map((u) => u.talent.id));
    }

    const formatted = results.map((profile) =>
      formatTalentResult(profile, {
        is_saved: recruiterId ? savedSet.has(profile.user.id) : false,
        is_upvoted: recruiterId ? upvotedSet.has(profile.user.id) : false,
      }),
    );

    const last = results[results.length - 1];
    const first = results[0];

    return {
      results: formatted,
      count: results.length,
      nextCursor: last ? encodeCursor(extractCursorFrom(last.user)) : null,
      previousCursor: first
        ? encodeCursor(extractCursorFrom(first.user))
        : null,
      hasNextPage: results.length === safeLimit,
      hasPreviousPage: Boolean(query.cursor),
    };
  }

  async getTalentById(
    talentId: string,
    recruiterId?: string,
  ): Promise<Partial<TalentSearchResult>> {
    const user = await this.userRepo.findOne({
      where: {
        id: talentId,
        role: UserRole.TALENT,
        profile_completed: true,
      },
      relations: ["talent_profile", "metrics"],
    });

    if (
      !user ||
      !user.talent_profile ||
      user.talent_profile.profile_status !== ProfileStatus.APPROVED
    ) {
      throw new NotFoundError("Talent profile not found");
    }

    const [saved, upvoted] = recruiterId
      ? await Promise.all([
          this.saveRepo.findOne({
            where: {
              recruiter: { id: recruiterId },
              talent: { id: talentId },
            },
          }),
          this.upvoteRepo.findOne({
            where: {
              recruiter: { id: recruiterId },
              talent: { id: talentId },
            },
          }),
        ])
      : [null, null];

    return formatTalentResult(user, {
      is_saved: Boolean(saved),
      is_upvoted: Boolean(upvoted),
    });
  }

  async toggleUpvoteTalent(
    talentId: string,
    recruiterId: string,
  ): Promise<string> {
    if (talentId === recruiterId) {
      throw new ClientError("You cannot upvote yourself");
    }

    const [recruiter, talent] = await Promise.all([
      this.userRepo.findOne({ where: { id: recruiterId } }),
      this.userRepo.findOne({
        where: { id: talentId, role: UserRole.TALENT, profile_completed: true },
        relations: ["talent_profile"],
      }),
    ]);

    if (!recruiter || recruiter.role !== UserRole.RECRUITER) {
      throw new NotFoundError("Recruiter not found or unauthorized");
    }

    if (
      !talent ||
      !talent.talent_profile ||
      talent.talent_profile.profile_status !== "approved"
    ) {
      throw new NotFoundError("Talent not found or not approved");
    }

    const existingUpvote = await this.upvoteRepo.findOne({
      where: {
        recruiter: { id: recruiterId },
        talent: { id: talentId },
      },
    });

    if (existingUpvote) {
      await this.upvoteRepo.remove(existingUpvote);
      await this.metricsService.decrementMetric(talentId, "upvotes");
      await CacheService.del(`dashboard_talent_${recruiterId}`);
      return "unupvoted";
    } else {
      const upvote = this.upvoteRepo.create({ recruiter, talent });
      await this.upvoteRepo.save(upvote);
      await this.metricsService.incrementMetric(talentId, "upvotes");
      await this.notificationService.sendNotification(
        NotificationType.UPVOTE,
        recruiterId,
        talentId,
      );
      await CacheService.del(`dashboard_talent_${recruiterId}`);
      return "upvoted";
    }
  }

  async getSavedTalents(
    recruiterId: string,
    query: SearchTalentsDto,
  ): Promise<PaginatedResponse<Partial<TalentSearchResult>>> {
    const limit = Number(query.limit);
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10;

    const qb = this.saveRepo.createQueryBuilder("save");
    buildTalentQuery(qb, query, "saved", recruiterId);
    qb.take(safeLimit);

    const [results, upvotes] = await Promise.all([
      qb.getMany(),
      this.upvoteRepo.find({
        where: { recruiter: { id: recruiterId } },
        relations: ["talent"],
      }),
    ]);

    const upvotedSet = new Set(upvotes.map((u) => u.talent.id));

    const formatted = results.map((saved) =>
      formatTalentResult(saved, {
        is_saved: true,
        is_upvoted: upvotedSet.has(saved.talent.id),
      }),
    );

    const last = results[results.length - 1];
    const first = results[0];

    return {
      results: formatted,
      count: results.length,
      nextCursor: last ? encodeCursor(extractCursorFrom(last.talent)) : null,
      previousCursor: first
        ? encodeCursor(extractCursorFrom(first.talent))
        : null,
      hasNextPage: results.length === safeLimit,
      hasPreviousPage: Boolean(query.cursor),
    };
  }

  async getTopTalents(limit = 10): Promise<Partial<TalentSearchResult>[]> {
    const talents = await this.profileRepo.find({
      relations: ["user", "user.metrics", "user.talent_profile"],
      where: {
        user: {
          profile_completed: true,
          role: UserRole.TALENT,
        },
      },
    });

    const scored = talents
      .map((profile) => {
        const metrics = profile.user.metrics;
        const score =
          (metrics?.upvotes || 0) * 3 +
          (metrics?.recruiter_saves || 0) * 2 +
          (metrics?.profile_views || 0);
        return { profile, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((entry) => formatTalentResult(entry.profile.user));

    return scored;
  }
}
