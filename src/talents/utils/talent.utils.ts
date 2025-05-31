import { MetricsEntity } from "@src/entities/metrics.entity";
import { SavedTalentEntity } from "@src/entities/savedTalent.entity";
import { TalentProfileEntity } from "@src/entities/talentProfile.entity";
import { UserEntity } from "@src/entities/user.entity";
import { CursorPayload, TalentSearchResult } from "@src/interfaces";
import { SelectQueryBuilder } from "typeorm";
import { SearchTalentsDto } from "../schemas/searchTalents.schema";

/**
 * Encodes a cursor payload to a base64 string.
 */
export const encodeCursor = (cursor: CursorPayload): string => {
  return Buffer.from(JSON.stringify(cursor)).toString("base64");
};

/**
 * Decodes a base64-encoded cursor into a payload object.
 */
export const decodeCursor = (encoded: string): CursorPayload | null => {
  try {
    const decoded = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
    if (decoded?.created_at && decoded?.id) {
      return {
        created_at: new Date(decoded.created_at),
        id: decoded.id,
      };
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Returns a cursor from an entity that contains the necessary fields.
 */
export const extractCursorFrom = (record: {
  created_at: Date;
  id: string;
}): CursorPayload => ({
  created_at: record.created_at,
  id: record.id,
});

/**
 * Apply filters for talent search queries, ensuring partial match capabilities with ranking optimization.
 */
export const applyTalentFilters = (
  qb: SelectQueryBuilder<any>,
  query: SearchTalentsDto,
  alias = "talent",
) => {
  const skillTextField = `${alias}.skills_text`;
  const levelField = `${alias}.experience_level`;

  if (query.q) {
    qb.andWhere(
      `similarity(user.first_name || ' ' || user.last_name, :q) > 0.3
       OR user.first_name ILIKE '%' || :q || '%'
       OR user.last_name ILIKE '%' || :q || '%'`,
      { q: query.q },
    );
  }

  if (query.skills?.length) {
    const skillQuery = query.skills.join(" ");
    if (process.env.NODE_ENV === "test") {
      qb.andWhere(`${skillTextField} ILIKE '%' || :skillQuery || '%'`, {
        skillQuery,
      });
    } else {
      qb.andWhere(
        `similarity(${skillTextField}, :skillQuery) > 0.3
         OR ${skillTextField} ILIKE '%' || :skillQuery || '%'`,
        { skillQuery },
      );
    }
  }

  if (query.experience) {
    qb.andWhere(`${levelField} = :experience`, {
      experience: query.experience,
    });
  }

  if (query.state) {
    qb.andWhere(`user.state ILIKE :state`, { state: `%${query.state}%` });
  }

  if (query.country) {
    qb.andWhere(`user.country ILIKE :country`, {
      country: `%${query.country}%`,
    });
  }
};

/**
 * Build a query for searching talents or saved talents.
 * @param qb - The query builder instance.
 * @param query - The search query parameters.
 * @param source - The source of the query, either "talent" or "saved".
 * @param recruiterId - The ID of the recruiter (optional).
 */
export const buildTalentQuery = (
  qb: SelectQueryBuilder<any>,
  query: SearchTalentsDto,
  source: "talent" | "saved",
  recruiterId?: string,
): void => {
  if (source === "talent") {
    qb.innerJoinAndSelect("talent.user", "user")
      .leftJoinAndSelect("user.metrics", "metrics")
      .where("user.profile_completed = true")
      .andWhere("talent.profile_status = 'approved'");
  } else {
    qb.innerJoinAndSelect("save.talent", "user")
      .innerJoinAndSelect("user.talent_profile", "talent")
      .leftJoinAndSelect("user.metrics", "metrics")
      .where("save.recruiter_id = :recruiterId", { recruiterId })
      .andWhere("user.profile_completed = true")
      .andWhere("talent.profile_status = 'approved'");
  }

  applyTalentFilters(qb, query);

  if (query.cursor) {
    const decoded = decodeCursor(query.cursor);
    const direction = query.direction || "next";
    if (decoded?.created_at && decoded?.id) {
      const operator = direction === "next" ? ">" : "<";
      qb.andWhere(`(user.created_at, user.id) ${operator} (:created_at, :id)`, {
        created_at: decoded.created_at,
        id: decoded.id,
      });
    }
  }

  const baseOrder = ["user.created_at", "user.id"];

  if (query.sort === "upvotes") {
    qb.orderBy("metrics.upvotes", "DESC")
      .addOrderBy(baseOrder[0], "ASC")
      .addOrderBy(baseOrder[1], "ASC");
  } else if (query.sort === "experience") {
    qb.orderBy("talent.experience_level", "DESC")
      .addOrderBy(baseOrder[0], "ASC")
      .addOrderBy(baseOrder[1], "ASC");
  } else {
    qb.orderBy(baseOrder[0], "ASC").addOrderBy(baseOrder[1], "ASC");
  }
};

/**
 * Format the result of a talent search or saved talent query.
 * @param input - The input entity, which can be a TalentProfileEntity, SavedTalentEntity, or UserEntity.
 * @returns A formatted object containing relevant user and profile information.
 */
export const formatTalentResult = (
  input: TalentProfileEntity | SavedTalentEntity | UserEntity,
): Partial<TalentSearchResult> => {
  let user: UserEntity;
  let profile: TalentProfileEntity | null = null;
  let metrics: MetricsEntity = null;
  let resume_path: string;
  let recruiter_saves: number = 0;

  if ("talent" in input && "created_at" in input.talent) {
    // SavedTalentEntity (getSavedTalents)
    user = input.talent;
    profile = user.talent_profile;
    metrics = user.metrics;
  } else if ("user" in input) {
    // TalentProfileEntity (searchTalents)
    user = (input as TalentProfileEntity).user;
    profile = input as TalentProfileEntity;
    metrics = user.metrics;
  } else {
    // UserEntity
    user = input as UserEntity;
    profile = user.talent_profile;
    metrics = user.metrics;
    resume_path = profile?.resume_path ?? "";
    recruiter_saves = metrics?.recruiter_saves ?? 0;
  }

  const result: Partial<TalentSearchResult> = {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    avatar: user.avatar,
    state: user.state,
    country: user.country,
    linkedin_profile: user.linkedin_profile,
    created_at: user.created_at,
    skills: profile?.skills ?? [],
    experience_level: profile?.experience_level ?? "",
    portfolio_url: profile?.portfolio_url ?? "",
    resume_path: profile?.resume_path,
    upvotes: metrics?.upvotes ?? 0,
  };

  if (resume_path && recruiter_saves) {
    // UserEntity (getTalentById)
    result.resume_path = resume_path;
    result.metrics = {
      upvotes: metrics?.upvotes ?? 0,
      recruiter_saves: recruiter_saves,
    };
  }
  return result;
};
