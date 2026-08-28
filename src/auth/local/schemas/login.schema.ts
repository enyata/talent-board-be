import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string({ required_error: "required" })
    .email("invalid")
    .trim()
    .toLowerCase(),
  password: z.string({ required_error: "required" }).min(1, "required"),
});

export type LoginRequest = z.infer<typeof loginSchema>;
