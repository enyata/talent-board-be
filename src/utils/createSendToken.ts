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

  const refreshToken = signToken(user.id, "REFRESH_TOKEN_PRIVATE_KEY", {
    expiresIn: config.get<string>("REFRESH_TOKEN_TTL"),
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
    user,
    is_valid: true,
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  await entityManager.save(refresh);

  let cookieExpiresDays: string | number;

  try {
    cookieExpiresDays = config.get<string | number>("COOKIE_EXPIRES");
  } catch (configError) {
    const envCookieExpires =
      process.env.TALENTS_COOKIE_EXPIRES || process.env.COOKIE_EXPIRES;
    if (envCookieExpires) {
      cookieExpiresDays = envCookieExpires;
    } else {
      cookieExpiresDays = 7;
    }
  }

  let expireDaysNumber: number;

  // Handle both string and number types
  if (typeof cookieExpiresDays === "number") {
    expireDaysNumber = cookieExpiresDays;
  } else if (typeof cookieExpiresDays === "string") {
    // Try to parse the string as a number
    expireDaysNumber = Number(cookieExpiresDays);

    // Additional check for empty string or non-numeric string
    if (cookieExpiresDays.trim() === "" || isNaN(expireDaysNumber)) {
      expireDaysNumber = NaN;
    }
  } else {
    expireDaysNumber = NaN;
  }

  let expires: number;
  if (isNaN(expireDaysNumber) || expireDaysNumber <= 0) {
    expires = 7 * 24 * 60 * 60 * 1000;
  } else {
    expires = expireDaysNumber * 24 * 60 * 60 * 1000;
  }

  const expirationDate = new Date(Date.now() + expires);

  let validExpirationDate: Date;
  if (isNaN(expirationDate.getTime())) {
    const fallbackDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    validExpirationDate = fallbackDate;
  } else {
    validExpirationDate = expirationDate;
  }

  const cookieOptions: CookieOptions = {
    expires: validExpirationDate,
    httpOnly: true,
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
  };

  if (!cookieOptions.expires || isNaN(cookieOptions.expires.getTime())) {
    delete cookieOptions.expires;
    cookieOptions.maxAge = 7 * 24 * 60 * 60 * 1000;
  }

  console.log("Final cookie options before setting:", {
    expires: cookieOptions.expires,
    expiresType: cookieOptions.expires
      ? typeof cookieOptions.expires
      : "undefined",
    expiresValid: cookieOptions.expires
      ? !isNaN(cookieOptions.expires.getTime())
      : "no expires",
    maxAge: cookieOptions.maxAge,
    maxAgeType: cookieOptions.maxAge
      ? typeof cookieOptions.maxAge
      : "undefined",
  });

  if (options.mode === "redirect") {
    res.locals.access_token = accessToken;
    res.locals.refresh_token = refreshToken;

    try {
      res.cookie("refresh_token", refreshToken, cookieOptions);
    } catch (error) {
      throw error;
    }
    return;
  }

  res.status(statusCode).json({
    status: "success",
    message,
    data: { user: sanitizeUser(user) },
    tokens: { access_token: accessToken, refresh_token: refreshToken },
  });
};
