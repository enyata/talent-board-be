import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email format")
    .trim()
    .toLowerCase(),
});

export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;
