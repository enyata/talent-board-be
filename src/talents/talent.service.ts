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
import { CacheService } from "@src/utils/cache.service";
import { SearchTalentsDto } from "./schemas/searchTalents.schema";
import { decodeCursor, encodeCursor } from "./talent.utils";

export class TalentService {
  private readonly userRepo = AppDataSource.getRepository(UserEntity);
  private readonly saveRepo = AppDataSource.getRepository(SavedTalentEntity);
  private readonly profileRepo =
    AppDataSource.getRepository(TalentProfileEntity);
  private readonly upvoteRepo = AppDataSource.getRepository(TalentUpvoteEntity);
  private readonly notificationService = new NotificationService();
  private readonly metricsService = new MetricsService();

  async saveTalent(talentId: string, recruiterId: string) {
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

  async searchTalents(query: SearchTalentsDto) {
    const qb = this.profileRepo
      .createQueryBuilder("talent")
      .leftJoinAndSelect("talent.user", "user")
      .leftJoinAndSelect("user.metrics", "metrics")
      .where("user.profile_completed = true")
      .andWhere("talent.profile_status = :status", {
        status: ProfileStatus.APPROVED,
      });

    if (query.q) {
      qb.andWhere(
        "(user.first_name ILIKE :q OR user.last_name ILIKE :q OR EXISTS (SELECT 1 FROM unnest(talent.skills) s WHERE s ILIKE :q))",
        { q: `%${query.q}%` },
      );
    }

    if (query.skills?.length) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM unnest(talent.skills) s WHERE ${query.skills.map((_, i) => `s ILIKE :skill${i}`).join(" OR ")})`,
        Object.fromEntries(query.skills.map((s, i) => [`skill${i}`, `%${s}%`])),
      );
    }

    if (query.experience) {
      qb.andWhere("talent.experience_level = :experience", {
        experience: query.experience,
      });
    }

    if (query.state) {
      qb.andWhere("user.state ILIKE :state", { state: `%${query.state}%` });
    }

    if (query.country) {
      qb.andWhere("user.country ILIKE :country", {
        country: `%${query.country}%`,
      });
    }

    switch (query.sort) {
      case "upvotes":
        qb.orderBy("metrics.upvotes", "DESC");
        break;
      case "experience":
        qb.orderBy("talent.experience_level", "DESC");
        break;
      default:
        qb.orderBy("user.created_at", "DESC").addOrderBy("user.id", "ASC");
        break;
    }

    qb.take(query.limit);

    if (query.cursor) {
      const decoded = decodeCursor(query.cursor);
      const direction = query.direction || "next";

      if (decoded?.created_at && decoded?.id) {
        const operator = direction === "next" ? ">" : "<";
        qb.andWhere(
          `(user.created_at, user.id) ${operator} (:created_at, :id)`,
          {
            created_at: decoded.created_at,
            id: decoded.id,
          },
        );
      }
    }

    const results = await qb.getMany();

    const formatted = results.map((talent) => ({
      id: talent.user.id,
      first_name: talent.user.first_name,
      last_name: talent.user.last_name,
      avatar: talent.user.avatar,
      state: talent.user.state,
      country: talent.user.country,
      linkedin_profile: talent.user.linkedin_profile,
      skills: talent.skills,
      experience_level: talent.experience_level,
      portfolio_url: talent.portfolio_url,
    }));

    const last = results[results.length - 1];
    const first = results[0];

    return {
      results: formatted,
      count: results.length,
      nextCursor: last
        ? encodeCursor({ created_at: last.user.created_at, id: last.user.id })
        : null,
      previousCursor: first
        ? encodeCursor({ created_at: first.user.created_at, id: first.user.id })
        : null,
      hasNextPage: results.length === query.limit,
      hasPreviousPage: !!query.cursor,
    };
  }

  async getTalentById(talentId: string) {
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

    const { talent_profile, metrics } = user;

    return {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      avatar: user.avatar,
      state: user.state,
      country: user.country,
      linkedin_profile: user.linkedin_profile,
      portfolio_url: talent_profile.portfolio_url,
      resume_path: talent_profile.resume_path,
      skills: talent_profile.skills,
      experience_level: talent_profile.experience_level,
      created_at: user.created_at,
      metrics: {
        upvotes: metrics?.upvotes || 0,
        recruiter_saves: metrics?.recruiter_saves || 0,
      },
    };
  }

  async toggleUpvoteTalent(talentId: string, recruiterId: string) {
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
}
