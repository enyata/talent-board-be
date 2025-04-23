import express from "express";
import passport from "passport";
import {
  googleOAuth,
  googleOAuthCallback,
} from "../controllers/googleAuth.controller";

const router = express.Router();

router.get("/google", googleOAuth);
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  googleOAuthCallback,
);

export default router;
