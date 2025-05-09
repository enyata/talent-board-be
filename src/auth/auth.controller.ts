import AppDataSource from "@src/datasource";
import { RefreshToken } from "@src/entities/refreshToken.entity";
import asyncHandler from "@src/middlewares/asyncHandler";
import { NextFunction, Request, Response } from "express";

export const logoutUser = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const entityManager = AppDataSource.manager;
    const refreshToken = req.cookies["refreshToken"];

    if (refreshToken) {
      await entityManager.update(
        RefreshToken,
        { token: refreshToken, is_valid: true },
        { is_valid: false },
      );
    }

    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: req.secure || req.headers["x-forwarded-proto"] === "https",
    });

    return res.status(200).json({
      status: "success",
      message: "User logged out successfully",
    });
  },
);
