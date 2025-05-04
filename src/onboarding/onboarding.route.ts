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

router.use(deserializeUser);
router.use(uploadResume);
router.use(injectResumePath);

router.patch(
  "/talent",
  parseFormDataFields(["skills"]),
  validateData(talentOnboardingSchema, ["body"]),
  onboardTalent,
);

router.patch(
  "/recruiter",
  parseFormDataFields(["roles_looking_for"]),
  validateData(recruiterOnboardingSchema, ["body"]),
  onboardRecruiter,
);

export default router;
