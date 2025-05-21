import { MetricsEntity } from "@src/entities/metrics.entity";
import { SavedTalentEntity } from "@src/entities/savedTalent.entity";
import { TalentProfileEntity } from "@src/entities/talentProfile.entity";
import { UserEntity } from "@src/entities/user.entity";
import { CursorPayload, TalentSearchResult } from "@src/interfaces";
import { SelectQueryBuilder } from "typeorm";
import { SearchTalentsDto } from "./schemas/searchTalents.schema";

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
