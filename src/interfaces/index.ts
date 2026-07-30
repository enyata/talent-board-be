import { MessageRequestStatus } from "@src/entities/messageRequest.entity";
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
  first_name?: string;
  last_name?: string;
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

export interface IncompleteSignupReminderJobData {
  userId: string;
}

export interface MessageRequestUserSummary {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar: string | null;
  role: UserRole | null;
}

export interface MessageRequestSummary {
  id: string;
  intro_note: string | null;
  status: MessageRequestStatus;
  responded_at: Date | null;
  created_at: Date;
  updated_at: Date;
  recruiter: MessageRequestUserSummary;
  talent: MessageRequestUserSummary;
}

export interface ConversationThreadSummary {
  id: string;
  recruiter_last_seen_at: Date | null;
  talent_last_seen_at: Date | null;
  latest_message_at: Date | null;
  created_at: Date;
  updated_at: Date;
  accepted_request_id: string | null;
  recruiter: MessageRequestUserSummary;
  talent: MessageRequestUserSummary;
}

export interface MessageSummary {
  id: string;
  body: string;
  created_at: Date;
  updated_at: Date;
  sender: MessageRequestUserSummary;
  source_request_id: string | null;
}

export interface AcceptedMessageRequestSummary {
  request: MessageRequestSummary;
  thread: ConversationThreadSummary;
  initial_message: MessageSummary | null;
}

export interface MessageRequestPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedMessageRequestSummary {
  requests: MessageRequestSummary[];
  pagination: MessageRequestPagination;
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
  bio: string;
  job_title: string;
  resume_path: string;
  upvotes: number;
  metrics?: {
    upvotes: number;
    recruiter_saves: number;
  };
  is_saved: boolean;
  is_upvoted: boolean;
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
