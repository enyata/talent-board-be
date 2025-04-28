import authRoutes from "@/auth/auth.route";
import express from "express";

const router = express.Router();

router.use("/auth", authRoutes);

export default router;
