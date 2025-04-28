import { AppError } from "@/exceptions/appError";
import { CustomJwtPayload } from "@/interfaces";
import config from "config";
import { sign, verify } from "jsonwebtoken";

export const signToken = (
  id: string,
  keyName: "accessTokenPrivateKey" | "refreshTokenPrivateKey",
  options?: object,
): string => {
  const signingKey = Buffer.from(
    config.get<string>(keyName),
    "base64",
  ).toString("ascii");

  return sign({ id }, signingKey, {
    ...(options && options),
    algorithm: "RS256",
  });
};

export const verifyToken = (
  token: string,
  keyName: "accessTokenPublicKey" | "refreshTokenPublicKey",
): CustomJwtPayload | null => {
  const publicKey = Buffer.from(config.get<string>(keyName), "base64").toString(
    "ascii",
  );

  try {
    return verify(token, publicKey) as CustomJwtPayload;
  } catch (error) {
    throw new AppError("Invalid or expired token", 401);
  }
};
