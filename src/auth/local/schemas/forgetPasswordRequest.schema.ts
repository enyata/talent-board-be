import { z } from "zod";

export const forgetPasswordRequestSchema = z.object({
  email: z
    .string({ required_error: "required" })
    .email("invalid")
    .trim()
    .toLowerCase(),
});

export type ForgetPasswordRequest = z.infer<typeof forgetPasswordRequestSchema>;
