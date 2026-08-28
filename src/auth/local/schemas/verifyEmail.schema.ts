import { z } from "zod";

export const verifyEmailSchema = z.object({
  email: z.string().email("Invalid email format"),
  otp: z.string().min(4, "Invalid OTP").max(8, "Invalid OTP"),
});

export type VerifyEmailRequest = z.infer<typeof verifyEmailSchema>;
