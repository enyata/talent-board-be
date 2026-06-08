import { z } from "zod";

export const resendOtpSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email format")
    .trim()
    .toLowerCase(),
});

export type ResendOtpRequest = z.infer<typeof resendOtpSchema>;
