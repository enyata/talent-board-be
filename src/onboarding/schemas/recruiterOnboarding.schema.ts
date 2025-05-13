import { HiringFor } from "@src/entities/recruiterProfile.entity";
import { z } from "zod";

export const recruiterOnboardingSchema = z.object({
  state: z.string().min(1, "State is required"),

  country: z.string().min(1, "Country is required"),

  linkedin_profile: z.string().url("Must be a valid LinkedIn URL"),

  work_email: z.string().email("Must be a valid work email"),

  company_industry: z.string().min(1, "Company industry is required"),

  roles_looking_for: z
    .array(z.string(), {
      invalid_type_error: "Roles must be an array of strings.",
    })
    .min(1, "At least one role is required"),

  hiring_for: z.nativeEnum(HiringFor, {
    errorMap: () => ({
      message: "Hiring for must be one of 'myself', or 'my company'",
    }),
  }),
});

export type RecruiterOnboardingDTO = z.infer<typeof recruiterOnboardingSchema>;
