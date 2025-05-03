import { deserializeUser } from "@src/middlewares/deserializeUser";
import { injectResumePath } from "@src/middlewares/injectResumePath";
import { parseFormDataFields } from "@src/middlewares/parseFormDataFields";
import { uploadResume } from "@src/middlewares/uploadResume";
import { validateData } from "@src/middlewares/validateData";
import { Router } from "express";
import { onboardTalent } from "./onboarding.controller";
import { talentOnboardingSchema } from "./schemas/talentOnboarding.schema";

const router = Router();

router.patch(
  "/talent",
  deserializeUser,
  uploadResume,
  parseFormDataFields,
  injectResumePath,
  validateData(talentOnboardingSchema, ["body"]),
  onboardTalent,
);

export default router;
