import AppDataSource from "@src/datasource";
import asyncHandler from "@src/middlewares/asyncHandler";
import { createSendToken } from "@src/utils/createSendToken";
import { NextFunction, Request, Response } from "express";
import { OnboardingService } from "./onboarding.service";
import { RecruiterOnboardingDTO } from "./schemas/recruiterOnboarding.schema";
import { TalentOnboardingDTO } from "./schemas/talentOnboarding.schema";

export const onboardTalent = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const service = new OnboardingService();
    const entityManager = AppDataSource.manager;
    const userId = req.user.id;
    const resumePath = req.file?.path;

    const payload = {
      ...req.body,
      resume_path: resumePath,
    } as TalentOnboardingDTO;

    const updatedUser = await service.onboardTalent(userId, payload);

    await createSendToken(
      updatedUser,
      200,
      "Talent onboarded successfully",
      req,
      res,
      entityManager,
    );
  },
);

export const onboardRecruiter = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const service = new OnboardingService();
    const entityManager = AppDataSource.manager;
    const userId = req.user.id;
    const resumePath = req.file?.path;

    const payload = {
      ...req.body,
      resume_path: resumePath,
    } as RecruiterOnboardingDTO;

    const updatedUser = await service.onboardRecruiter(userId, payload);

    await createSendToken(
      updatedUser,
      200,
      "Recruiter onboarded successfully",
      req,
      res,
      entityManager,
    );
  },
);
