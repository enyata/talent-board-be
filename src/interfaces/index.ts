import { RecruiterOnboardingDTO } from "@src/onboarding/schemas/recruiterOnboarding.schema";
import { TalentOnboardingDTO } from "@src/onboarding/schemas/talentOnboarding.schema";
import { JwtPayload } from "jsonwebtoken";

export interface IResponseError {
  status: string;
  message: string;
}

export interface CustomJwtPayload extends JwtPayload {
  id: string;
  role: "talent" | "recruiter";
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
