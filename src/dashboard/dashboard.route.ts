import { UserRole } from "@src/entities/user.entity";
import { checkRole } from "@src/middlewares/checkRole";
import { deserializeUser } from "@src/middlewares/deserializeUser";
import express from "express";
import {
  getRecruiterDashboard,
  getTalentDashboard,
  getUserNotifications,
  markNotificationAsRead,
} from "./dashboard.controller";

const router = express.Router();

router.use(deserializeUser);

router.get("/talent", checkRole(UserRole.TALENT), getTalentDashboard);
router.get("/recruiter", checkRole(UserRole.RECRUITER), getRecruiterDashboard);

router.get(
  "/notifications",
  checkRole([UserRole.TALENT, UserRole.RECRUITER]),
  getUserNotifications,
);
router.patch(
  "/notifications/:notificationId/read",
  checkRole([UserRole.TALENT, UserRole.RECRUITER]),
  markNotificationAsRead,
);

export default router;
