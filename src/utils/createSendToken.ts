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
  console.log("createSendToken===>>>", user.id);
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

  // FIX: Properly handle cookie expiration with validation
  const cookieExpiresDays = config.get<string>("COOKIE_EXPIRES");
  console.log({ cookieExpiresDays }, "raw COOKIE_EXPIRES from config");

  // Convert to number and validate
  const expireDaysNumber = Number(cookieExpiresDays);
  console.log({ expireDaysNumber }, "parsed COOKIE_EXPIRES number");

  let expires: number;
  // Check if the conversion resulted in a valid number
  if (isNaN(expireDaysNumber) || expireDaysNumber <= 0) {
    console.error("❌ Invalid COOKIE_EXPIRES value:", cookieExpiresDays);
    console.error("Using default of 7 days");

    // Use 7 days as default fallback
    expires = 7 * 24 * 60 * 60 * 1000;
  } else {
    expires = expireDaysNumber * 24 * 60 * 60 * 1000;
  }

  console.log({ expires }, "calculated expires milliseconds");

  // Create expiration date and validate it
  const expirationDate = new Date(Date.now() + expires);
  console.log({ expirationDate }, "expiration date object");

  let validExpirationDate: Date;
  // Validate the date is valid
  if (isNaN(expirationDate.getTime())) {
    console.error("❌ Invalid expiration date created");
    // Fallback to 7 days from now
    const fallbackDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    console.log("Using fallback date:", fallbackDate);

    validExpirationDate = fallbackDate;
  } else {
    validExpirationDate = expirationDate;
  }

  const cookieOptions: CookieOptions = {
    expires: validExpirationDate,
    httpOnly: true,
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
  };

  console.log({ cookieOptions }, "final cookieOptions");

  // Additional validation before setting cookie
  if (!cookieOptions.expires || isNaN(cookieOptions.expires.getTime())) {
    console.error(
      "❌ Cookie expiration is still invalid, removing expires option",
    );
    delete cookieOptions.expires;
    // Use maxAge instead as fallback
    cookieOptions.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  }

  console.log({ cookieOptions }, "validated cookieOptions before setting");

  if (options.mode === "redirect") {
    res.locals.access_token = accessToken;
    res.locals.refresh_token = refreshToken;

    try {
      res.cookie("refresh_token", refreshToken, cookieOptions);
      console.log("✅ Cookie set successfully in redirect mode");
    } catch (error) {
      console.error("❌ Error setting cookie in redirect mode:", error);
      throw error;
    }
    return;
  }

  try {
    res.cookie("refresh_token", refreshToken, cookieOptions);
    console.log("✅ Cookie set successfully in JSON mode");
  } catch (error) {
    console.error("❌ Error setting cookie in JSON mode:", error);
    throw error;
  }

  res.status(statusCode).json({
    status: "success",
    message,
    data: { user: sanitizeUser(user) },
    tokens: { access_token: accessToken, refresh_token: refreshToken },
  });
};
