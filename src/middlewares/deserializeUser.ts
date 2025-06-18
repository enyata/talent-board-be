import config from "config";
import type { NextFunction, Request, Response } from "express";
import { EntityManager } from "typeorm";
import AppDataSource from "../datasource";
import { RefreshToken } from "../entities/refreshToken.entity";
import { UserEntity } from "../entities/user.entity";
import { UnauthorizedError } from "../exceptions/unauthorizedError";
import { signToken, verifyToken } from "../utils/jwt";
import asyncHandler from "./asyncHandler";

const extractTokens = (req: Request) => {
  let accessToken =
    req.headers.authorization?.split(" ")[1] || req.cookies.access_token;
  const refreshToken =
    req.cookies.refresh_token || req.headers["x-refresh-token"];

  if (!accessToken && !refreshToken) {
    throw new UnauthorizedError("Missing tokens. Please log in.");
  }

  return { accessToken, refreshToken };
};

const checkUserExists = async (userId: string) => {
  const user = await UserEntity.findOne({ where: { id: userId } });

  if (!user) {
    throw new UnauthorizedError("User not found");
  }

  return user;
};

const refreshAccessToken = async (
  refreshToken: string,
  entityManager: EntityManager,
): Promise<string | false> => {
  const decoded = verifyToken(refreshToken, "refreshTokenPublicKey");
  if (!decoded) return false;

  const user = await checkUserExists(decoded.id);
  if (!user) return false;

  const storedToken = await entityManager.findOne(RefreshToken, {
    where: { token: refreshToken, is_valid: true, user: { id: user.id } },
  });

  if (!storedToken) return false;

  const access_token = signToken(user.id, "accessTokenPrivateKey", {
    expiresIn: config.get<number>("accessTokenTtl"),
  });

  return access_token;
};

export const deserializeUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { accessToken, refreshToken } = extractTokens(req);
    const entityManager = AppDataSource.manager;

    const decoded = accessToken
      ? verifyToken(accessToken, "accessTokenPublicKey")
      : null;

    console.log("Decoded Access Token:", decoded);
    if (decoded) {
      const currentUser = await checkUserExists(decoded.id);
      req.user = currentUser;
      return next();
    }

    if (refreshToken) {
      const newAccessToken = await refreshAccessToken(
        refreshToken,
        entityManager,
      );

      if (!newAccessToken) {
        return next(
          new UnauthorizedError("Invalid refresh token! Please log in again."),
        );
      }

      res.setHeader("x-access-token", newAccessToken);

      const newDecoded = verifyToken(newAccessToken, "accessTokenPublicKey");
      req.user = await checkUserExists(newDecoded!.id);
    }
    return next();
  },
);
