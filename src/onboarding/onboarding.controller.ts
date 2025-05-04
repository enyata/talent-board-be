import AppDataSource from "@src/datasource";
import { UserRole } from "@src/entities/user.entity";
import asyncHandler from "@src/middlewares/asyncHandler";
import { createSendToken } from "@src/utils/createSendToken";
import { NextFunction, Request, Response } from "express";
import { OnboardingService } from "./onboarding.service";
import { RecruiterOnboardingDTO } from "./schemas/recruiterOnboarding.schema";
import { TalentOnboardingDTO } from "./schemas/talentOnboarding.schema";

const service = new OnboardingService();

export const createOnboardingHandler = <T>(
  role: UserRole,
  formatPayload: (req: Request) => T,
) =>
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const entityManager = AppDataSource.manager;
    const userId = req.user.id;
    const payload = formatPayload(req);

    const updatedUser = await service.onboardUser(userId, payload, role);

    await createSendToken(
      updatedUser,
      200,
      `${role.charAt(0).toUpperCase() + role.slice(1)} onboarded successfully`,
      req,
      res,
      entityManager,
    );
  });

export const onboardTalent = createOnboardingHandler<TalentOnboardingDTO>(
  UserRole.TALENT,
  (req) => ({
    ...req.body,
    resume_path: req.file?.path ?? "",
  }),
);

export const onboardRecruiter = createOnboardingHandler<RecruiterOnboardingDTO>(
  UserRole.RECRUITER,
  (req) => ({
    ...req.body,
    resume_path: req.file?.path ?? "",
  }),
);
