import { deserializeUser } from "@src/middlewares/deserializeUser";
import { Router } from "express";
import { getCurrentUser } from "./users.controller";

const router = Router();

router.get("/me", deserializeUser, getCurrentUser);

export default router;
