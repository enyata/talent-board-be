import { LINKEDIN_SCOPES } from "@/auth/auth.constants";
import AppDataSource from "@/datasource";
import { UnauthorizedError } from "@/exceptions/unauthorizedError";
import asyncHandler from "@/middlewares/asyncHandler";
import { createSendToken } from "@/utils/createSendToken";
import config from "config";
import type { NextFunction, Request, Response } from "express";
import { LinkedInAuthService } from "./linkedin.service";

const linkedInAuthService = new LinkedInAuthService();

export const linkedInOAuth = (_req: Request, res: Response) => {
  const clientId = config.get<string>("LINKEDIN_CLIENT_ID");
  const redirectUri = `${config.get<string>("BASE_URL")}/${config.get<string>("API_PREFIX")}/auth/linkedin/callback`;
  const scope = LINKEDIN_SCOPES;

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri,
  )}&scope=${encodeURIComponent(scope.join(" "))}`;

  res.redirect(authUrl);
};

export const linkedInOAuthCallback = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const entityManager = AppDataSource.manager;

    if (!req.user) {
      return next(new UnauthorizedError("LinkedIn authentication failed"));
    }

    const profile = req.user as {
      first_name: string;
      last_name: string;
      email: string;
      avatar?: string;
    };

    const user = await linkedInAuthService.authenticateOrCreateUser(
      profile,
      entityManager,
    );

    await createSendToken(
      user,
      200,
      "LinkedIn OAuth successful",
      req,
      res,
      entityManager,
    );
  },
);
