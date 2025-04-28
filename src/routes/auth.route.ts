import { Router } from "express";
import passport from "passport";
import {
  googleOAuth,
  googleOAuthCallback,
} from "../controllers/googleAuth.controller";
import {
  linkedInOAuth,
  linkedInOAuthCallback,
} from "../controllers/linkedinAuth.controller";

const router = Router();

/**
 * Google OAuth
 */
router.get("/google", googleOAuth);
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  googleOAuthCallback,
);

/**
 * LinkedIn OAuth
 */
router.get("/linkedin", linkedInOAuth);
router.get(
  "/linkedin/callback",
  passport.authenticate("linkedin", { session: false }),
  linkedInOAuthCallback,
);

export default router;
