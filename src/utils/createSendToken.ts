import { RefreshToken } from "@src/entities/refreshToken.entity";
import { UserEntity } from "@src/entities/user.entity";
import { CreateSendTokenOptions } from "@src/interfaces";
import config from "config";
import type { CookieOptions, Request, Response } from "express";
import { EntityManager } from "typeorm";
import { signToken } from "./jwt";
import { sanitizeUser } from "./sanitizeUser";

export const createSendToken = async (
  user: Partial<UserEntity>,
  statusCode: number,
  message: string,
  req: Request,
  res: Response,
  entityManager: EntityManager,
  options: CreateSendTokenOptions = { mode: "json" },
) => {
  const accessToken = signToken(user.id, "accessTokenPrivateKey", {
    expiresIn: config.get<string>("accessTokenTtl"),
  });

  const refreshToken = signToken(user.id, "refreshTokenPrivateKey", {
    expiresIn: config.get<string>("refreshTokenTtl"),
  });

  const userRef = await entityManager.findOneByOrFail(UserEntity, {
    id: user.id,
  });

  const ipAddress =
    req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
    req.socket.remoteAddress ||
    "unknown";
  const userAgent = req.headers["user-agent"] || "unknown";

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
    user: userRef,
    is_valid: true,
    ip_address: ipAddress,
    user_agent: userAgent,
  });
  await entityManager.save(refresh);

  const expires =
    Number(config.get<string>("cookieExpires")) * 24 * 60 * 60 * 1000;

  const cookieOptions: CookieOptions = {
    expires: new Date(Date.now() + expires),
    httpOnly: true,
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
  };

  if (options.mode === "redirect") {
    res.locals.access_token = accessToken;
    res.cookie("refresh_token", refreshToken, cookieOptions);
    return;
  }

  res.cookie("refresh_token", refreshToken, cookieOptions);

  res.status(statusCode).json({
    status: "success",
    message,
    data: { user: sanitizeUser(userRef) },
    tokens: { access_token: accessToken, refresh_token: refreshToken },
  });
};
