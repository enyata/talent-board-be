import { RefreshToken } from "@src/entities/refreshToken.entity";
import { UserEntity } from "@src/entities/user.entity";
import { CreateSendTokenOptions } from "@src/interfaces";
import config from "config";
import type { Request, Response } from "express";
import { EntityManager } from "typeorm";
import { signToken } from "./jwt";
import { sanitizeUser } from "./sanitizeUser";

interface CookieOptions {
  expires?: Date;
  maxAge?: number;
  httpOnly?: boolean;
  secure?: boolean;
}

export const createSendToken = async (
  user: UserEntity,
  statusCode: number,
  message: string,
  req: Request,
  res: Response,
  entityManager: EntityManager,
  options: CreateSendTokenOptions = { mode: "json" },
) => {
  const accessToken = signToken(user.id, "ACCESS_TOKEN_PRIVATE_KEY", {
    expiresIn: config.get<string>("ACCESS_TOKEN_TTL"),
  });
  console.log({ accessToken }, "===>1");

  const refreshToken = signToken(user.id, "REFRESH_TOKEN_PRIVATE_KEY", {
    expiresIn: config.get<string>("REFRESH_TOKEN_TTL"),
  });

  console.log({ refreshToken }, "error===>2");

  const ipAddress =
    req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
    req.socket.remoteAddress ||
    "unknown";
  const userAgent = req.headers["user-agent"] || "unknown";
  console.log({ ipAddress }, "===>3");

  await entityManager.update(
    RefreshToken,
    {
      user: { id: user.id },
      ip_address: ipAddress,
      user_agent: userAgent,
      is_valid: true,
    },
    { is_valid: false },
  );

  const refresh = entityManager.create(RefreshToken, {
    token: refreshToken,
    user,
    is_valid: true,
    ip_address: ipAddress,
    user_agent: userAgent,
  });
  await entityManager.save(refresh);

  const expires =
    Number(config.get<string>("COOKIE_EXPIRES")) * 24 * 60 * 60 * 1000;
  console.log({ expires }, "expires=cookies==>>>");
  const cookieOptions: CookieOptions = {
    expires: new Date(Date.now() + expires),
    httpOnly: true,
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
  };

  console.log({ cookieOptions }, "cookieOptions===>>");

  if (options.mode === "redirect") {
    res.locals.access_token = accessToken;
    res.locals.refresh_token = refreshToken;
    res.cookie("refresh_token", refreshToken, cookieOptions);
    return;
  }

  res.cookie("refresh_token", refreshToken, cookieOptions);

  res.status(statusCode).json({
    status: "success",
    message,
    data: { user: sanitizeUser(user) },
    tokens: { access_token: accessToken, refresh_token: refreshToken },
  });
};
