import { z } from "zod";

export const resendOtpSchema = z.object({
  email: z
    .string({ required_error: "required" })
    .email("invalid")
    .trim()
    .toLowerCase(),
});

export type ResendOtpRequest = z.infer<typeof resendOtpSchema>;
