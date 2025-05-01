import { RefreshToken } from "@src/entities/refreshToken.entity";
import { UserEntity } from "@src/entities/user.entity";
import config from "config";
import type { CookieOptions, Request, Response } from "express";
import { EntityManager } from "typeorm";
import { signToken } from "./jwt";

export const createSendToken = async (
  user: Partial<UserEntity>,
  statusCode: number,
  message: string,
  req: Request,
  res: Response,
  entityManager: EntityManager,
) => {
  const accessToken = signToken(user.id, "accessTokenPrivateKey", {
    expiresIn: config.get<string>("accessTokenTtl"),
  });

  const refreshToken = signToken(user.id, "refreshTokenPrivateKey", {
    expiresIn: config.get<string>("refreshTokenTtl"),
  });

  await entityManager.save(RefreshToken, {
    token: refreshToken,
    user: { id: user.id } as UserEntity,
  });

  const expires =
    Number(config.get<string>("cookieExpires")) * 24 * 60 * 60 * 1000;

  const cookieOptions: CookieOptions = {
    expires: new Date(Date.now() + expires),
    httpOnly: true,
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
  };

  res.cookie("refreshToken", refreshToken, cookieOptions);

  res.status(statusCode).json({
    status: "success",
    message,
    data: { user },
    tokens: { access_token: accessToken, refresh_token: refreshToken },
  });
};
