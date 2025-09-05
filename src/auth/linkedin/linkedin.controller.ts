import { LINKEDIN_SCOPES } from "@src/auth/auth.constants";
import AppDataSource from "@src/datasource";
import { UnauthorizedError } from "@src/exceptions/unauthorizedError";
import asyncHandler from "@src/middlewares/asyncHandler";
import { createSendToken } from "@src/utils/createSendToken";
import config from "config";
import type { NextFunction, Request, Response } from "express";
import { LinkedInAuthService } from "./linkedin.service";

const linkedInAuthService = new LinkedInAuthService();

export const linkedInOAuth = (req: Request, res: Response) => {
  const clientId = config.get<string>("LINKEDIN_CLIENT_ID");
  const redirectUri = `${config.get<string>("BASE_URL")}/${config.get<string>("API_PREFIX")}/auth/linkedin/callback`;
  const scope = LINKEDIN_SCOPES;

  const redirectParams = new URLSearchParams({
    redirect_uri: req.query.redirect_uri as string,
    include_tokens_in_url: req.query.include_tokens_in_url as string,
  }).toString();

  console.log({ redirectUri, scope, clientId, redirectParams });

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope.join(" "))}&state=${encodeURIComponent(
    redirectParams,
  )}`;

  console.log(authUrl);

  res.redirect(authUrl);
};

export const linkedInOAuthCallback = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const entityManager = AppDataSource.manager;

    if (!req.user) {
      return next(new UnauthorizedError("LinkedIn authentication failed"));
    }

    const profile = req.user as unknown as {
      first_name: string;
      last_name: string;
      email: string;
      avatar?: string;
    };

    const user = await linkedInAuthService.authenticateOrCreateUser(
      profile,
      entityManager,
    );

    const rawState = req.query.state as string;
    const decodedState = decodeURIComponent(rawState);
    const stateParams = new URLSearchParams(decodedState);

    const redirectUri =
      stateParams.get("redirect_uri") ||
      config.get<string>("FRONTEND_URL") ||
      "http://localhost:3000";

    console.log(
      { redirectUri, rawState, decodedState, stateParams },
      "redirect uri===>>",
    );

    const includeTokensInUrl =
      stateParams.get("include_tokens_in_url") === "true";

    await createSendToken(
      user,
      200,
      "LinkedIn OAuth successful",
      req,
      res,
      entityManager,
      { mode: "redirect" },
    );

    console.log({ includeTokensInUrl }, "fix===>>01");

    const queryParams = new URLSearchParams({
      access_token: res.locals.access_token,
      ...(includeTokensInUrl && { refresh_token: res.locals.refresh_token }),
    }).toString();

    res.redirect(`${redirectUri}?${queryParams}`);
  },
);
