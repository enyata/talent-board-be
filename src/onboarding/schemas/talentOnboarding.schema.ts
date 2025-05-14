import { ExperienceLevel } from "@src/entities/talentProfile.entity";
import { z } from "zod";

export const talentOnboardingSchema = z.object({
  state: z.string().min(1, "State is required"),

  country: z.string().min(1, "Country is required"),

  linkedin_profile: z.string().url("Must be a valid LinkedIn URL"),

  portfolio_url: z.string().url("Must be a valid URL").optional(),
  skills: z
    .array(z.string(), {
      invalid_type_error: "Skills must be an array of strings.",
    })
    .min(1, "At least one skill is required"),

  experience_level: z.nativeEnum(ExperienceLevel, {
    errorMap: () => ({
      message:
        "Experience level must be one of 'entry', 'intermediate', or 'expert'",
    }),
  }),

  resume_path: z.string().min(1, "Resume upload failed"),
});

export type TalentOnboardingDTO = z.infer<typeof talentOnboardingSchema>;
