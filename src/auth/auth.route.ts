import asyncHandler from "@src/middlewares/asyncHandler";
import { validateData } from "@src/middlewares/validateData";
import express from "express";
import passport from "passport";
import { logoutUser } from "./auth.controller";
import { googleOAuth, googleOAuthCallback } from "./google/google.controller";
import {
  linkedInOAuth,
  linkedInOAuthCallback,
} from "./linkedin/linkedin.controller";
import { signupUser, verifyEmail } from "./local/local.controller";
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

router.post("/signup", validateData(signupSchema), asyncHandler(signupUser));

router.post(
  "/verify-email",
  validateData(verifyEmailSchema),
  asyncHandler(verifyEmail),
);

export default router;
