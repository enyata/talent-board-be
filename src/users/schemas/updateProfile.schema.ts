import { z } from "zod";

export const updateProfileSchema = z.object({
  first_name: z.string().min(1).max(50),
  last_name: z.string().min(1).max(50),
  bio: z.string().max(250).optional(),
  avatar: z.string().optional(),
});

export type UpdateProfileDTO = z.infer<typeof updateProfileSchema>;
