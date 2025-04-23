import type { NextFunction, Request, Response } from "express";
import passport from "passport";
import AppDataSource from "../datasource";
import { UnauthorizedError } from "../exceptions/unauthorizedError";
import asyncHandler from "../middlewares/asyncHandler";
import { GoogleAuthService } from "../services/googleAuth.service";
import { createSendToken } from "../utils/createSendToken";

const googleAuthService = new GoogleAuthService();

export const googleOAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
});

export const googleOAuthCallback = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const entityManager = AppDataSource.manager;

    if (!req.user) {
      return next(new UnauthorizedError("Google authentication failed"));
    }

    const profile = req.user as unknown as {
      first_name: string;
      last_name: string;
      email: string;
      avatar?: string;
    };

    const user = await googleAuthService.authenticateOrCreateUser(
      profile,
      entityManager,
    );

    await createSendToken(
      user,
      200,
      "Google OAuth successful",
      req,
      res,
      entityManager,
    );
  },
);
