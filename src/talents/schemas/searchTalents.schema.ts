import { z } from "zod";

export const ExperienceLevelEnum = z.enum(["entry", "intermediate", "expert"]);

export const searchTalentsSchema = z.object({
  q: z.string().optional(),

  skills: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) =>
      typeof val === "string" ? val.split(",").map((s) => s.trim()) : val,
    ),

  experience: ExperienceLevelEnum.optional(),

  state: z.string().optional(),
  country: z.string().optional(),

  sort: z.enum(["recent", "upvotes", "experience"]).optional(),

  limit: z
    .preprocess((val) => {
      if (typeof val === "string" && /^[0-9]+$/.test(val)) {
        return parseInt(val);
      }
      return val;
    }, z.number().int().min(1).max(100))
    .optional()
    .default(10),

  cursor: z
    .string()
    .regex(/^[a-zA-Z0-9+/=]+$/, { message: "Invalid cursor format" })
    .optional(),

  direction: z
    .preprocess(
      (val) => (typeof val === "string" ? val.toLowerCase() : val),
      z.enum(["next", "prev"]),
    )
    .optional(),
});

export type SearchTalentsDto = z.infer<typeof searchTalentsSchema>;
