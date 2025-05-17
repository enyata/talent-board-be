import { UserRole } from "@src/entities/user.entity";
import { checkRole } from "@src/middlewares/checkRole";
import { deserializeUser } from "@src/middlewares/deserializeUser";
import { validateData } from "@src/middlewares/validateData";
import { Router } from "express";
import { searchTalentsSchema } from "./schemas/searchTalents.schema";
import { saveTalent, searchTalents } from "./talent.controller";

const router = Router();

router.use(deserializeUser);
router.use(checkRole(UserRole.RECRUITER));

router.post("/:id/save", saveTalent);
router.get("/", validateData(searchTalentsSchema, ["query"]), searchTalents);

export default router;
