import { ExperienceLevel } from "@src/entities/user.entity";
import { z } from "zod";

export const talentOnboardingSchema = z.object({
  location: z.string().min(1, "Location is required"),

  portfolio_url: z.string().url("Must be a valid URL").optional(),

  linkedin_profile: z.string().url("Must be a valid LinkedIn URL"),

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
