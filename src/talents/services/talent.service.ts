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
  ): Promise<PaginatedResponse<Partial<TalentSearchResult>>> {
    const limit = Number(query.limit);
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10;

    const qb = this.profileRepo.createQueryBuilder("talent");
    buildTalentQuery(qb, query, "talent");
    qb.take(safeLimit);

    const results = await qb.getMany();

    const formatted = results.map(formatTalentResult);

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

  async getTalentById(talentId: string): Promise<Record<string, any>> {
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

    const results = formatTalentResult(user);
    return results;
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

    const results = await qb.getMany();
    const formatted = results.map(formatTalentResult);

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
}
