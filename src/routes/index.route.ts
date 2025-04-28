import express from "express";
import authRoutes from "../auth/auth.route";

const router = express.Router();

router.use("/auth", authRoutes);

export default router;
