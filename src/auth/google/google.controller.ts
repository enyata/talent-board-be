import { GOOGLE_SCOPES } from "@src/auth/auth.constants";
import AppDataSource from "@src/datasource";
import { UnauthorizedError } from "@src/exceptions/unauthorizedError";
import asyncHandler from "@src/middlewares/asyncHandler";
import { createSendToken } from "@src/utils/createSendToken";
import config from "config";
import type { NextFunction, Request, Response } from "express";
import passport from "passport";
import { GoogleAuthService } from "./google.service";

const googleAuthService = new GoogleAuthService();

export const googleOAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const redirectUri = encodeURIComponent(
    (req.query.state as string) ||
      config.get<string>("FRONTEND_URL") ||
      "http://localhost:3000",
  );

  passport.authenticate("google", {
    scope: GOOGLE_SCOPES,
    state: redirectUri,
  })(req, res, next);
};

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

    const redirectUri = decodeURIComponent(
      (req.query.state as string) ||
        config.get<string>("FRONTEND_URL") ||
        "http://localhost:3000",
    );

    await createSendToken(
      user,
      200,
      "Google OAuth successful",
      req,
      res,
      entityManager,
      { mode: "redirect" },
    );

    res.redirect(
      `${redirectUri}?access_token=${res.locals.access_token}&refresh_token=${res.locals.refresh_token}`,
    );
  },
);
