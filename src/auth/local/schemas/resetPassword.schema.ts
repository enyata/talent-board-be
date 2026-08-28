import { z } from "zod";

export const resetPasswordSchema = z
  .object({
    email: z
      .string({ required_error: "Email is required" })
      .email("Invalid email format")
      .trim()
      .toLowerCase(),
    token: z.string({ required_error: "Token is required" }),

    password: z
      .string({ required_error: "Password is required" })
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-z]/, "Password must include a lowercase letter")
      .regex(/[A-Z]/, "Password must include an uppercase letter")
      .regex(/\d/, "Password must include a number")
      .regex(/[@$!%*?&]/, "Password must include a special character"),

    confirm_password: z.string({
      required_error: "Confirm password is required",
    }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;
export type ResetPasswordDTO = Omit<ResetPasswordRequest, "confirm_password">;
