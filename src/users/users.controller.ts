import asyncHandler from "@src/middlewares/asyncHandler";
import { NextFunction, Request, Response } from "express";
import { UpdateProfileDTO } from "./schemas/updateProfile.schema";
import { UserService } from "./users.service";

const userService = new UserService();

export const getCurrentUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await userService.getCurrentUser(req.user.id);
    res.status(200).json({
      status: "success",
      message: "User fetched successfully",
      data: { user },
    });
  },
);

export const updateProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user!;
    const data = req.body as UpdateProfileDTO & { avatar?: string };

    const updated = await userService.updateProfile(user.id, user.role, data);

    res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      data: updated,
    });
  },
);
