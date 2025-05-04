import authRoutes from "@src/auth/auth.route";
import onboardingRoutes from "@src/onboarding/onboarding.route";
import express from "express";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/onboarding", onboardingRoutes);

export default router;
