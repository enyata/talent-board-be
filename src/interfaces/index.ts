import { NotificationType } from "@src/entities/notification.entity";
import { UserRole } from "@src/entities/user.entity";
import { RecruiterOnboardingDTO } from "@src/onboarding/schemas/recruiterOnboarding.schema";
import { TalentOnboardingDTO } from "@src/onboarding/schemas/talentOnboarding.schema";
import { JwtPayload } from "jsonwebtoken";

export interface IResponseError {
  status: string;
  message: string;
}

export interface CustomJwtPayload extends JwtPayload {
  id: string;
  role: UserRole;
}

export interface UploadConfig {
  destinationFolder: string;
  fieldname: string;
  allowedMimeTypes: string[];
  maxSizeMB?: number;
}

export interface CreateSendTokenOptions {
  mode?: "json" | "redirect";
}

export interface SharedFields {
  state: string;
  country: string;
  linkedin_profile: string;
}

export type TalentPayload = TalentOnboardingDTO & SharedFields;
export type RecruiterPayload = RecruiterOnboardingDTO & SharedFields;
export type OnboardingPayload = TalentPayload | RecruiterPayload;

export interface NotificationJobData {
  senderId: string;
  recipientId: string;
  type: NotificationType;
}

export interface MetricsJobData {
  userId: string;
  field:
    | "upvotes"
    | "profile_views"
    | "recruiter_saves"
    | "weekly_search_appearances";
}

export interface TalentSearchResult {
  result: { upvotes: number; recruiter_saves: number };
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar: string | null;
  state: string;
  country: string;
  linkedin_profile: string;
  created_at: Date;
  skills: string[];
  experience_level: string;
  portfolio_url: string;
  resume_path: string;
  upvotes: number;
  metrics?: {
    upvotes: number;
    recruiter_saves: number;
  };
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  nextCursor: string | null;
  previousCursor: string | null;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CursorPayload {
  created_at: Date;
  id: string;
}
