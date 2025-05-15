import authRoutes from "@src/auth/auth.route";
import dashboardRoutes from "@src/dashboard/dashboard.route";
import onboardingRoutes from "@src/onboarding/onboarding.route";
import userRoutes from "@src/users/users.route";
import express from "express";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/onboarding", onboardingRoutes);
router.use("/users", userRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
