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
import { LocalAuthController } from "./local/local.controller";
import { LocalAuthService } from "./local/local.service";
import { signupSchema } from "./local/schemas/signup.schema";

const router = express.Router();

const localAuthService = new LocalAuthService();
const localAuthController = new LocalAuthController(localAuthService);

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

router.post(
  "/signup",
  validateData(signupSchema),
  asyncHandler(localAuthController.signupUser.bind(localAuthController)),
);

export default router;
