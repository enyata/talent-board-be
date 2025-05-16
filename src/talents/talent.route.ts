import { UserRole } from "@src/entities/user.entity";
import { checkRole } from "@src/middlewares/checkRole";
import { deserializeUser } from "@src/middlewares/deserializeUser";
import { Router } from "express";
import { saveTalent } from "./talent.controller";

const router = Router();

router.use(deserializeUser);
router.post("/:id/save", checkRole(UserRole.RECRUITER), saveTalent);

export default router;
