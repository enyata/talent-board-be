import { z } from "zod";

export const recruiterOnboardingSchema = z.object({
  location: z.string().min(1, "Location is required"),

  linkedin_profile: z.string().url("Must be a valid LinkedIn URL"),

  work_email: z.string().email("Must be a valid work email"),

  company_industry: z.string().min(1, "Company industry is required"),

  roles_looking_for: z
    .array(z.string(), {
      invalid_type_error: "Roles must be an array of strings.",
    })
    .min(1, "At least one role is required"),
  // add resume if needed for verification of recruiter's credentials
  resume_path: z.string().min(1, "Resume upload failed").optional(),
});

export type RecruiterOnboardingDTO = z.infer<typeof recruiterOnboardingSchema>;
