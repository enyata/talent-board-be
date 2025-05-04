import { deserializeUser } from "@src/middlewares/deserializeUser";
import { injectResumePath } from "@src/middlewares/injectResumePath";
import { parseFormDataFields } from "@src/middlewares/parseFormDataFields";
import { uploadResume } from "@src/middlewares/uploadResume";
import { validateData } from "@src/middlewares/validateData";
import { Router } from "express";
import { onboardRecruiter, onboardTalent } from "./onboarding.controller";
import { recruiterOnboardingSchema } from "./schemas/recruiterOnboarding.schema";
import { talentOnboardingSchema } from "./schemas/talentOnboarding.schema";

const router = Router();

router.patch(
  "/talent",
  deserializeUser,
  uploadResume,
  parseFormDataFields(["skills"]),
  injectResumePath,
  validateData(talentOnboardingSchema, ["body"]),
  onboardTalent,
);

router.patch(
  "/recruiter",
  deserializeUser,
  uploadResume,
  parseFormDataFields(["roles_looking_for"]),
  injectResumePath,
  validateData(recruiterOnboardingSchema, ["body"]),
  onboardRecruiter,
);

export default router;
