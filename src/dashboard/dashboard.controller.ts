import asyncHandler from "@src/middlewares/asyncHandler";
import { NextFunction, Request, Response } from "express";
import { DashboardService } from "./services/dashboard.service";

const dashboardService = new DashboardService();

export const getTalentDashboard = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = req.user!;
    const data = await dashboardService.getTalentDashboard(user.id);
    res.status(200).json({
      status: "success",
      message: "Dashboard fetched successfully",
      data,
    });
  },
);

export const getRecruiterDashboard = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = req.user!;
    const data = await dashboardService.getRecruiterDashboard(user.id);
    res.status(200).json({
      status: "success",
      message: "Dashboard fetched successfully",
      data,
    });
  },
);

export const getUserNotifications = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = req.user!;
    const requestedLimit = Number(req.query.limit);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 100)
      : 20;

    const [data, summary] = await Promise.all([
      dashboardService.getUserNotifications(user.id, limit),
      dashboardService.getNotificationSummary(user.id, user.role),
    ]);

    res.status(200).json({
      status: "success",
      message: "Notifications fetched successfully",
      data,
      summary,
    });
  },
);

export const markNotificationAsRead = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = req.user!;
    const data = await dashboardService.markNotificationAsRead(
      user.id,
      req.params.notificationId,
    );

    res.status(200).json({
      status: "success",
      message: "Notification marked as read",
      data,
    });
  },
);
