import { deserializeUser } from "@src/middlewares/deserializeUser";
import { validateData } from "@src/middlewares/validateData";
import { Router } from "express";
import { z } from "zod";
import { createSkillHandler, getAllSkillsHandler } from "./skills.controller";

const router = Router();

const createSkillSchema = z.object({
  name: z.string().min(1, "Skill name is required").max(100),
});

router.get("/", getAllSkillsHandler);
router.post(
  "/",
  deserializeUser,
  validateData(createSkillSchema, ["body"]),
  createSkillHandler,
);

export default router;
