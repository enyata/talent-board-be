import { UserRole } from "@src/entities/user.entity";
import { checkRole } from "@src/middlewares/checkRole";
import { deserializeUser } from "@src/middlewares/deserializeUser";
import express from "express";
import {
  getRecruiterDashboard,
  getTalentDashboard,
} from "./dashboard.controller";

const router = express.Router();

router.use(deserializeUser);

router.get("/talent", checkRole(UserRole.TALENT), getTalentDashboard);
router.get("/recruiter", checkRole(UserRole.RECRUITER), getRecruiterDashboard);

export default router;
