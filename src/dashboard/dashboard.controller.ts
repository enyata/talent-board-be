import asyncHandler from "@src/middlewares/asyncHandler";
import { NextFunction, Request, Response } from "express";
import { DashboardService } from "./services/dashboard.service";

const dashboardService = new DashboardService();

export const getTalentDashboard = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const data = await dashboardService.getTalentDashboard(req.user.id);
    res.status(200).json({
      status: "success",
      message: "Dashboard fetched successfully",
      data,
    });
  },
);

export const getRecruiterDashboard = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const data = await dashboardService.getRecruiterDashboard(req.user.id);
    res.status(200).json({
      status: "success",
      message: "Dashboard fetched successfully",
      data,
    });
  },
);
