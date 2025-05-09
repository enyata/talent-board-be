import express from "express";
import passport from "passport";
import { logoutUser } from "./auth.controller";
import { googleOAuth, googleOAuthCallback } from "./google/google.controller";
import {
  linkedInOAuth,
  linkedInOAuthCallback,
} from "./linkedin/linkedin.controller";

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

export default router;
