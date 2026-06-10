import { validateData } from "@src/middlewares/validateData";
import express from "express";
import passport from "passport";
import { logoutUser } from "./auth.controller";
import { googleOAuth, googleOAuthCallback } from "./google/google.controller";
import {
  linkedInOAuth,
  linkedInOAuthCallback,
} from "./linkedin/linkedin.controller";
import {
  forgetPassword,
  loginUser,
  resendOtp,
  resetPassword,
  signupUser,
  verifyEmail,
} from "./local/local.controller";
import { forgotPasswordSchema } from "./local/schemas/forgotPassword.schema";
import { loginSchema } from "./local/schemas/login.schema";
import { resendOtpSchema } from "./local/schemas/resendOtp.schema";
import { resetPasswordSchema } from "./local/schemas/resetPassword.schema";
import { signupSchema } from "./local/schemas/signup.schema";
import { verifyEmailSchema } from "./local/schemas/verifyEmail.schema";

const router = express.Router();

router.get("/google", googleOAuth);
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  googleOAuthCallback,
);

router.get("/linkedin", linkedInOAuth);
router.get(
  "/linkedin/callback",
  passport.authenticate("linkedin", { session: false }),
  linkedInOAuthCallback,
);

router.post("/logout", logoutUser);

router.post("/login", validateData(loginSchema), loginUser);

router.post("/signup", validateData(signupSchema), signupUser);

router.post("/verify-email", validateData(verifyEmailSchema), verifyEmail);

router.post("/resend-otp", validateData(resendOtpSchema), resendOtp);

router.post(
  "/forgot-password",
  validateData(forgotPasswordSchema),
  forgetPassword,
);

router.post(
  "/reset-password",
  validateData(resetPasswordSchema),
  resetPassword,
);

export default router;
